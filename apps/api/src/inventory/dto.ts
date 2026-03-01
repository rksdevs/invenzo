import { IsNumber, IsString } from 'class-validator';

export class AdjustmentDto {
  @IsString()
  productId!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  reason!: string;
}
