import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto';
import { computeInvoiceLine, computeInvoiceTotals } from '../common/utils/tax';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: { tenantId },
      include: { supplier: true, items: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreatePurchaseDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('At least one item required');
    }

    const rows = dto.items.map((item) => ({ ...item, ...computeInvoiceLine(item) }));
    const roundOff = dto.roundOff ?? 0;
    const totals = computeInvoiceTotals(rows, 0, roundOff);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.purchaseInvoice.create({
        data: {
          tenantId,
          supplierId: dto.supplierId,
          invoiceNumber: dto.invoiceNumber,
          invoiceDate: new Date(dto.invoiceDate),
          eWayBillNo: dto.eWayBillNo,
          taxableValue: totals.taxableValue,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          totalTaxAmount: totals.totalTaxAmount,
          roundOff,
          totalAmount: totals.totalAmount,
          items: {
            create: rows.map((row) => ({
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
        include: { items: true },
      });

      await tx.stockMovement.createMany({
        data: rows.map((row) => ({
          tenantId,
          productId: row.productId,
          type: 'PURCHASE',
          quantity: row.quantity,
          referenceType: 'purchase_invoice',
          referenceId: invoice.id,
        })),
      });

      return invoice;
    });
  }

  async attachFile(tenantId: string, purchaseId: string, file?: Express.Multer.File) {
    if (!file) {
      return { message: 'No file uploaded' };
    }

    return this.prisma.fileAttachment.create({
      data: {
        tenantId,
        purchaseInvoiceId: purchaseId,
        fileName: file.originalname,
        contentType: file.mimetype,
        objectKey: `local/${tenantId}/${Date.now()}-${file.originalname}`,
      },
    });
  }
}
