import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ConfirmInvoiceItemDto {
  @IsOptional()
  @IsString()
  slNo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  hsnSac?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  rate!: number;

  @IsOptional()
  @IsString()
  per?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsNumber()
  gstRate?: number;

  @IsOptional()
  @IsString()
  barcode?: string;
}

export class ConfirmInvoiceDto {
  @IsString()
  supplierName!: string;

  @IsString()
  invoiceNumber!: string;

  @IsDateString()
  invoiceDate!: string;

  @IsOptional()
  @IsString()
  eWayBillNo?: string;

  @IsOptional()
  @IsNumber()
  roundOff?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfirmInvoiceItemDto)
  items!: ConfirmInvoiceItemDto[];
}
