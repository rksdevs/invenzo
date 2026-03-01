import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

class PurchaseItemDto {
  @IsString()
  productId!: string;

  @IsString()
  description!: string;

  @IsString()
  hsnSac!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  rate!: number;

  @IsNumber()
  gstRate!: number;
}

export class CreatePurchaseDto {
  @IsString()
  supplierId!: string;

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
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];
}
