import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

enum UserRole {
  OWNER = 'OWNER',
  CASHIER = 'CASHIER',
  ACCOUNTANT = 'ACCOUNTANT',
}

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: 'OWNER' | 'CASHIER' | 'ACCOUNTANT';
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: 'OWNER' | 'CASHIER' | 'ACCOUNTANT';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
