import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function dateRange(from?: string, to?: string): { gte?: Date; lte?: Date } | undefined {
  if (!from && !to) {
    return undefined;
  }
  return {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to ? { lte: new Date(to) } : {}),
  };
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  salesRegister(tenantId: string, from?: string, to?: string) {
    return this.prisma.salesInvoice.findMany({
      where: { tenantId, invoiceDate: dateRange(from, to) },
      include: { customer: true, payments: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  purchaseRegister(tenantId: string, from?: string, to?: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: { tenantId, invoiceDate: dateRange(from, to) },
      include: { supplier: true },
      orderBy: { invoiceDate: 'desc' },
    });
  }

  async gstSummary(tenantId: string, from?: string, to?: string) {
    const sales = await this.prisma.salesInvoice.aggregate({
      where: { tenantId, invoiceDate: dateRange(from, to) },
      _sum: { cgstAmount: true, sgstAmount: true, totalTaxAmount: true, taxableValue: true },
    });

    const purchases = await this.prisma.purchaseInvoice.aggregate({
      where: { tenantId, invoiceDate: dateRange(from, to) },
      _sum: { cgstAmount: true, sgstAmount: true, totalTaxAmount: true, taxableValue: true },
    });

    return { sales: sales._sum, purchases: purchases._sum };
  }

  async stockValuation(tenantId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { tenantId },
      select: { productId: true, quantity: true },
    });
    const groupedMap = movements.reduce(
      (acc: Map<string, number>, movement: { productId: string; quantity: unknown }) => {
        const qty = Number(movement.quantity ?? 0);
        acc.set(movement.productId, (acc.get(movement.productId) ?? 0) + qty);
        return acc;
      },
      new Map<string, number>(),
    );
    const grouped: Array<{ productId: string; quantity: number }> = [];
    for (const [productId, quantity] of groupedMap) {
      grouped.push({ productId, quantity });
    }

    const productIds = grouped.map((row) => row.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({ where: { tenantId, id: { in: productIds } } })
      : [];

    const rows = grouped.map((row) => {
      const product = products.find((entry: { id: string }) => entry.id === row.productId);
      const qty = row.quantity;
      const price = Number(product?.sellingPrice ?? 0);
      return {
        productId: row.productId,
        productName: product?.name ?? 'Unknown',
        quantity: qty,
        unitRate: price,
        valuation: qty * price,
      };
    });

    return {
      rows,
      totalValuation: rows.reduce((sum: number, row: { valuation: number }) => sum + row.valuation, 0),
    };
  }
}
