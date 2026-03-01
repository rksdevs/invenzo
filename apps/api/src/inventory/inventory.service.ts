import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustmentDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async stock(tenantId: string) {
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

    const grouped = Array.from(groupedMap.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const productIds = grouped.map((row) => row.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({ where: { tenantId, id: { in: productIds } } })
      : [];

    return grouped.map((row: { productId: string; quantity: number }) => {
      const product = products.find((entry: { id: string }) => entry.id === row.productId);
      const currentQty = row.quantity;
      return {
        productId: row.productId,
        productName: product?.name ?? 'Unknown',
        unit: product?.unit ?? 'PCS',
        currentQty,
        lowStock: product ? currentQty <= Number(product.lowStockThreshold) : false,
      };
    });
  }

  movements(tenantId: string, productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { tenantId, ...(productId ? { productId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async adjust(tenantId: string, dto: AdjustmentDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          tenantId,
          productId: dto.productId,
          quantity: dto.quantity,
          reason: dto.reason,
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: dto.productId,
          type: 'ADJUSTMENT',
          quantity: dto.quantity,
          referenceType: 'inventory_adjustment',
          referenceId: adjustment.id,
        },
      });

      return adjustment;
    });
  }
}
