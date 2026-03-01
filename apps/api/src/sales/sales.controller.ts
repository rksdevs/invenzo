import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  list(@CurrentUser() user: { tenantId: string }) {
    return this.salesService.list(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: { tenantId: string }, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user.tenantId, dto);
  }

  @Get(':id/print')
  print(@CurrentUser() user: { tenantId: string }, @Param('id') id: string) {
    return this.salesService.printPayload(user.tenantId, id);
  }
}
