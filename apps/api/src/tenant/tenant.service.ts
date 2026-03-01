import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from './dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(tenantId: string) {
    return this.prisma.tenant.findUnique({ where: { id: tenantId } });
  }

  updateMe(tenantId: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({ where: { id: tenantId }, data: dto });
  }
}
