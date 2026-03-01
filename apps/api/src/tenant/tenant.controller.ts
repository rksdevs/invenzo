import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateTenantDto } from './dto';

@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('me')
  getMe(@CurrentUser() user: { tenantId: string }) {
    return this.tenantService.getMe(user.tenantId);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: { tenantId: string }, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateMe(user.tenantId, dto);
  }
}
