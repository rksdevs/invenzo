import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserContext {
  userId: string;
  tenantId: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserContext;
  },
);
