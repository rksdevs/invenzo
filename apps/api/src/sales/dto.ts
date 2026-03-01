import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

enum PaymentModeDto {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  CREDIT = 'CREDIT',
}

class SalesItemDto {
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

class PaymentDto {
  @IsEnum(PaymentModeDto)
  mode!: PaymentModeDto;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  invoiceNumber!: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  roundOff?: number;

  @IsOptional()
  @IsBoolean()
  isCredit?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesItemDto)
  items!: SalesItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments!: PaymentDto[];
}
