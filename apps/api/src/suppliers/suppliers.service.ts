import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, q?: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  create(tenantId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { tenantId, ...dto } });
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto) {
    await this.prisma.supplier.updateMany({ where: { id, tenantId }, data: dto });
    return this.prisma.supplier.findFirst({ where: { id, tenantId } });
  }
}
