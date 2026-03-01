import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, q?: string) {
    return this.prisma.customer.findMany({
      where: { tenantId, ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  create(tenantId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { tenantId, ...dto } });
  }

  async update(tenantId: string, id: string, dto: UpdateCustomerDto) {
    await this.prisma.customer.updateMany({ where: { id, tenantId }, data: dto });
    return this.prisma.customer.findFirst({ where: { id, tenantId } });
  }
}
