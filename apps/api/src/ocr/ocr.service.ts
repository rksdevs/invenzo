import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { computeInvoiceLine, computeInvoiceTotals } from '../common/utils/tax';
import { ConfirmInvoiceDto } from './dto';

interface ParsedInvoiceItem {
  slNo: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  per: string;
  amount: number;
  gstRate: number;
}

@Injectable()
export class OcrService {
  constructor(private readonly prisma: PrismaService) {}

  async parseInvoice(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Invoice file is required');
    }
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('OCR API key missing (OCR_SPACE_API_KEY)');
    }

    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('language', 'eng');
    form.append('isTable', 'true');
    form.append('OCREngine', '2');
    form.append('isCreateSearchablePdf', 'false');
    form.append('file', new Blob([file.buffer as unknown as BlobPart], { type: file.mimetype }), file.originalname);

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: form,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.IsErroredOnProcessing) {
      throw new BadRequestException(payload?.ErrorMessage?.join?.(', ') ?? 'OCR processing failed');
    }

    const parsedText = String(payload?.ParsedResults?.map((r: { ParsedText?: string }) => r?.ParsedText ?? '').join('\n') ?? '');
    const draft = this.buildDraft(parsedText, file.originalname);
    return {
      sourceFileName: file.originalname,
      rawText: parsedText,
      draft,
      warnings: draft.items.length === 0 ? ['No line-items detected. Please edit manually before confirm.'] : [],
    };
  }

  async confirmInvoice(tenantId: string, dto: ConfirmInvoiceDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('At least one item is required');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let supplier = await tx.supplier.findFirst({
        where: { tenantId, name: { equals: dto.supplierName, mode: 'insensitive' } },
      });
      if (!supplier) {
        supplier = await tx.supplier.create({
          data: { tenantId, name: dto.supplierName },
        });
      }

      const resolvedItems: Array<{
        productId: string;
        description: string;
        hsnSac: string;
        quantity: number;
        rate: number;
        gstRate: number;
        taxableValue: number;
        cgstAmount: number;
        sgstAmount: number;
        totalAmount: number;
      }> = [];

      for (const item of dto.items) {
        const normalizedName = (item.description || item.name || '').trim();
        if (!normalizedName) {
          continue;
        }
        const hsnSac = (item.hsnSac?.trim() || '0000');
        const unit = (item.unit?.trim() || item.per?.trim() || 'PCS');
        const gstRate = Number(item.gstRate ?? 12);
        const quantity = Number(item.quantity);
        const rate = Number(item.rate);
        const barcode = item.barcode?.trim() || (await this.generateBarcode(tx, tenantId));

        let product = await tx.product.findFirst({
          where: {
            tenantId,
            OR: [
              { barcode },
              { name: { equals: normalizedName, mode: 'insensitive' } },
            ],
          },
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              tenantId,
              name: normalizedName,
              hsnSac,
              unit,
              sellingPrice: rate,
              gstRate,
              barcode,
              lowStockThreshold: 0,
            },
          });
        } else {
          product = await tx.product.update({
            where: { id: product.id },
            data: {
              hsnSac: product.hsnSac || hsnSac,
              unit: product.unit || unit,
              sellingPrice: rate,
              gstRate,
              barcode: product.barcode || barcode,
            },
          });
        }

        const computed = computeInvoiceLine({ quantity, rate, gstRate });
        resolvedItems.push({
          productId: product.id,
          description: normalizedName,
          hsnSac,
          quantity,
          rate,
          gstRate,
          taxableValue: computed.taxableValue,
          cgstAmount: computed.cgstAmount,
          sgstAmount: computed.sgstAmount,
          totalAmount: computed.totalAmount,
        });
      }

      const totals = computeInvoiceTotals(resolvedItems, 0, dto.roundOff ?? 0);
      const invoice = await tx.purchaseInvoice.create({
        data: {
          tenantId,
          supplierId: supplier.id,
          invoiceNumber: dto.invoiceNumber,
          invoiceDate: new Date(dto.invoiceDate),
          eWayBillNo: dto.eWayBillNo,
          taxableValue: totals.taxableValue,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          totalTaxAmount: totals.totalTaxAmount,
          roundOff: dto.roundOff ?? 0,
          totalAmount: totals.totalAmount,
          items: {
            create: resolvedItems.map((row) => ({
              tenantId,
              productId: row.productId,
              description: row.description,
              hsnSac: row.hsnSac,
              quantity: row.quantity,
              rate: row.rate,
              gstRate: row.gstRate,
              taxableValue: row.taxableValue,
              cgstAmount: row.cgstAmount,
              sgstAmount: row.sgstAmount,
              totalAmount: row.totalAmount,
            })),
          },
        },
        include: { items: true, supplier: true },
      });

      await tx.stockMovement.createMany({
        data: resolvedItems.map((row) => ({
          tenantId,
          productId: row.productId,
          type: 'PURCHASE',
          quantity: row.quantity,
          referenceType: 'purchase_invoice',
          referenceId: invoice.id,
        })),
      });

      return {
        success: true,
        invoiceId: invoice.id,
        itemsImported: resolvedItems.length,
      };
    });
  }

  private buildDraft(parsedText: string, sourceName: string) {
    const lines = parsedText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const invoiceNumber = this.matchFirst(parsedText, [/invoice\s*(?:no|number)?\s*[:#-]?\s*([A-Z0-9/-]+)/i]) ?? `OCR-${Date.now()}`;
    const invoiceDateRaw = this.matchFirst(parsedText, [/date\s*[:#-]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i]);
    const invoiceDate = this.normalizeDate(invoiceDateRaw) ?? new Date().toISOString().slice(0, 10);

    const items: ParsedInvoiceItem[] = [];
    for (const line of lines) {
      if (this.isNoiseLine(line)) continue;
      const strict = line.match(/^(\d{1,3})\s+(.+?)\s+(\d{4,10})\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+([A-Za-z]{1,6})\s+(\d+(?:\.\d+)?)/);
      if (strict) {
        const [, slNo, description, hsnSac, qtyRaw, rateRaw, per, amountRaw] = strict;
        const quantity = Number(qtyRaw);
        const rate = Number(rateRaw);
        const amount = Number(amountRaw);
        if (description.trim().length < 3 || quantity <= 0 || rate <= 0) continue;
        items.push({
          slNo,
          description: description.trim(),
          hsnSac,
          quantity,
          rate,
          per: per.toUpperCase(),
          amount,
          gstRate: 12,
        });
        continue;
      }

      const numberMatches = [...line.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
      if (numberMatches.length < 3) continue;
      const firstNum = line.search(/\d/);
      const description = line.slice(0, firstNum).replace(/^[^A-Za-z]+/, '').trim();
      if (description.length < 4) continue;
      const quantity = numberMatches[0];
      const rate = numberMatches[1];
      const amount = numberMatches[numberMatches.length - 1];
      if (quantity <= 0 || rate <= 0 || amount <= 0) continue;
      items.push({
        slNo: String(items.length + 1),
        description,
        hsnSac: '0000',
        quantity,
        rate,
        per: 'PCS',
        amount,
        gstRate: 12,
      });
    }

    const deduped = items.filter((item, idx) => idx === items.findIndex((x) => x.description.toLowerCase() === item.description.toLowerCase()));
    return {
      supplierName: this.deriveSupplierName(lines, sourceName),
      invoiceNumber,
      invoiceDate,
      items: deduped.slice(0, 80),
    };
  }

  private isNoiseLine(line: string): boolean {
    const lower = line.toLowerCase();
    return [
      'total',
      'tax',
      'cgst',
      'sgst',
      'igst',
      'invoice',
      'bill',
      'date',
      'phone',
      'mobile',
      'address',
      'bank',
      'upi',
      'gstin',
      'email',
      'description of goods',
      'slno',
    ].some((word) => lower.includes(word));
  }

  private deriveSupplierName(lines: string[], sourceName: string): string {
    const candidate = lines.find((line) => /[A-Za-z]/.test(line) && line.length > 3 && line.length < 48);
    return candidate ?? sourceName.replace(/\.[^.]+$/, '');
  }

  private matchFirst(input: string, patterns: RegExp[]): string | undefined {
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    return undefined;
  }

  private normalizeDate(input?: string): string | undefined {
    if (!input) return undefined;
    const parts = input.split(/[\/.-]/).map((p) => p.trim());
    if (parts.length !== 3) return undefined;
    const [dd, mm, yy] = parts.map((p) => Number(p));
    if (!dd || !mm || !yy) return undefined;
    const year = yy < 100 ? 2000 + yy : yy;
    const date = new Date(Date.UTC(year, mm - 1, dd));
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString().slice(0, 10);
  }

  private async generateBarcode(tx: Prisma.TransactionClient, tenantId: string): Promise<string> {
    for (let i = 0; i < 10; i++) {
      const code = `INVZ-${Date.now().toString().slice(-8)}-${Math.floor(100 + Math.random() * 900)}`;
      const exists = await tx.product.findFirst({ where: { tenantId, barcode: code }, select: { id: true } });
      if (!exists) return code;
    }
    return `INVZ-${randomUUID().slice(0, 12).toUpperCase()}`;
  }
}
