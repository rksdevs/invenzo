import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  list(@CurrentUser() user: { tenantId: string }, @Query('q') q?: string) {
    return this.suppliersService.list(user.tenantId, q);
  }

  @Post()
  create(@CurrentUser() user: { tenantId: string }, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: { tenantId: string }, @Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(user.tenantId, id, dto);
  }
}
