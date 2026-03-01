import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-register')
  salesRegister(@CurrentUser() user: { tenantId: string }, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.salesRegister(user.tenantId, from, to);
  }

  @Get('purchase-register')
  purchaseRegister(@CurrentUser() user: { tenantId: string }, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.purchaseRegister(user.tenantId, from, to);
  }

  @Get('gst-summary')
  gstSummary(@CurrentUser() user: { tenantId: string }, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.gstSummary(user.tenantId, from, to);
  }

  @Get('stock-valuation')
  stockValuation(@CurrentUser() user: { tenantId: string }) {
    return this.reportsService.stockValuation(user.tenantId);
  }
}
