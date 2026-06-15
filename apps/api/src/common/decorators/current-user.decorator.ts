import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export const GetCurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext): CurrentUser | string | string[] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
