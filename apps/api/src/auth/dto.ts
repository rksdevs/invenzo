import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupTenantDto {
  @IsString()
  businessName!: string;

  @IsOptional()
  @IsString()
  gstin?: string;

  @IsString()
  ownerName!: string;

  @IsEmail()
  ownerEmail!: string;

  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}
