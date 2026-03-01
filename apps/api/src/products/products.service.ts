import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, q?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { tenantId, ...dto } });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.prisma.product.updateMany({ where: { id, tenantId }, data: dto });
    return this.prisma.product.findFirst({ where: { id, tenantId } });
  }
}
