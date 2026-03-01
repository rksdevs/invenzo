import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: dto.role,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
  }

  update(tenantId: string, id: string, dto: UpdateUserDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.updateMany({ where: { id, tenantId }, data: dto });
      return tx.user.findFirst({
        where: { id, tenantId },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      });
    });
  }
}
