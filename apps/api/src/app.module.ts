import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ReportsModule } from './reports/reports.module';
import { HealthController } from './health.controller';
import { OcrModule } from './ocr/ocr.module';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/api/.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    TenantModule,
    UsersModule,
    ProductsModule,
    SuppliersModule,
    CustomersModule,
    PurchasesModule,
    SalesModule,
    InventoryModule,
    ReportsModule,
    OcrModule,
  ],
})
export class AppModule {}
