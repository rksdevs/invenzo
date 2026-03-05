import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OcrService } from './ocr.service';
import { ConfirmInvoiceDto } from './dto';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('invoices/parse')
  @UseInterceptors(FileInterceptor('file'))
  parseInvoice(@UploadedFile() file?: Express.Multer.File): Promise<unknown> {
    return this.ocrService.parseInvoice(file);
  }

  @Post('invoices/confirm')
  confirmInvoice(@CurrentUser() user: { tenantId: string }, @Body() dto: ConfirmInvoiceDto) {
    return this.ocrService.confirmInvoice(user.tenantId, dto);
  }
}
