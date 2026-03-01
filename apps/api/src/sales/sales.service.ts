import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto';
import { computeInvoiceLine, computeInvoiceTotals } from '../common/utils/tax';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.salesInvoice.findMany({
      where: { tenantId },
      include: { customer: true, items: true, payments: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateSaleDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('At least one item required');
    }

    for (const item of dto.items) {
      const stock = await this.prisma.stockMovement.aggregate({
        where: { tenantId, productId: item.productId },
        _sum: { quantity: true },
      });

      const available = Number(stock._sum.quantity ?? 0);
      if (available < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${item.productId}`);
      }
    }

    const rows = dto.items.map((item) => ({ ...item, ...computeInvoiceLine(item) }));
    const discountAmount = dto.discountAmount ?? 0;
    const roundOff = dto.roundOff ?? 0;
    const totals = computeInvoiceTotals(rows, discountAmount, roundOff);
    const totalAmount = totals.totalAmount;

    const paymentTotal = round2(dto.payments.reduce((sum, payment) => sum + payment.amount, 0));
    if (!dto.isCredit && paymentTotal < totalAmount) {
      throw new BadRequestException('Payment total is less than invoice total');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.salesInvoice.create({
        data: {
          tenantId,
          customerId: dto.customerId,
          invoiceNumber: dto.invoiceNumber,
          taxableValue: totals.taxableValue,
          discountAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          totalTaxAmount: totals.totalTaxAmount,
          roundOff,
          totalAmount,
          isCredit: dto.isCredit ?? false,
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
          payments: {
            create: dto.payments.map((payment) => ({
              tenantId,
              mode: payment.mode,
              amount: payment.amount,
              reference: payment.reference,
            })),
          },
        },
        include: { items: true, payments: true },
      });

      await tx.stockMovement.createMany({
        data: rows.map((row) => ({
          tenantId,
          productId: row.productId,
          type: 'SALE',
          quantity: -Math.abs(row.quantity),
          referenceType: 'sales_invoice',
          referenceId: invoice.id,
        })),
      });

      if (dto.customerId && dto.isCredit) {
        await tx.customerLedgerEntry.create({
          data: {
            tenantId,
            customerId: dto.customerId,
            salesInvoiceId: invoice.id,
            debit: totalAmount,
            credit: paymentTotal,
            note: 'Credit sale',
          },
        });
      }

      return invoice;
    });
  }

  async printPayload(tenantId: string, saleId: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { tenantId, id: saleId },
      include: {
        items: true,
        payments: true,
        customer: true,
        tenant: true,
      },
    });

    if (!invoice) {
      throw new BadRequestException('Invoice not found');
    }

    const groupedByHsn = new Map<string, { taxable: number; cgst: number; sgst: number; totalTax: number }>();
    for (const item of invoice.items) {
      const key = item.hsnSac;
      const current = groupedByHsn.get(key) ?? { taxable: 0, cgst: 0, sgst: 0, totalTax: 0 };
      current.taxable += Number(item.taxableValue);
      current.cgst += Number(item.cgstAmount);
      current.sgst += Number(item.sgstAmount);
      current.totalTax += Number(item.cgstAmount) + Number(item.sgstAmount);
      groupedByHsn.set(key, current);
    }

    return {
      invoice,
      hsnSummary: Array.from(groupedByHsn.entries()).map(([hsnSac, values]) => ({ hsnSac, ...values })),
    };
  }
}
