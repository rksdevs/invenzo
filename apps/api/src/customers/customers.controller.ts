import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: { tenantId: string }, @Query('q') q?: string) {
    return this.customersService.list(user.tenantId, q);
  }

  @Post()
  create(@CurrentUser() user: { tenantId: string }, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.tenantId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: { tenantId: string }, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(user.tenantId, id, dto);
  }
}
