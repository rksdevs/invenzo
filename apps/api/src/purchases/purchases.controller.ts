import { Body, Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto';

@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  list(@CurrentUser() user: { tenantId: string }) {
    return this.purchasesService.list(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: { tenantId: string }, @Body() dto: CreatePurchaseDto) {
    return this.purchasesService.create(user.tenantId, dto);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.purchasesService.attachFile(user.tenantId, id, file);
  }
}
