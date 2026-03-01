import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { AdjustmentDto } from './dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock')
  stock(@CurrentUser() user: { tenantId: string }) {
    return this.inventoryService.stock(user.tenantId);
  }

  @Get('movements')
  movements(@CurrentUser() user: { tenantId: string }, @Query('productId') productId?: string) {
    return this.inventoryService.movements(user.tenantId, productId);
  }

  @Post('adjustments')
  adjust(@CurrentUser() user: { tenantId: string }, @Body() dto: AdjustmentDto) {
    return this.inventoryService.adjust(user.tenantId, dto);
  }
}
