import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ALLOW_SUPER_ADMIN_KEY = 'allowSuperAdmin';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context not found');
    }

    // Super Admin pode acessar qualquer tenant
    const allowSuperAdmin = this.reflector.getAllAndOverride<boolean>(
      ALLOW_SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowSuperAdmin && user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Verifica se o tenant do param/body coincide com o tenant do usuário
    const requestTenantId =
      request.params?.tenantId || request.body?.tenantId || request.query?.tenantId;

    if (requestTenantId && requestTenantId !== user.tenantId) {
      throw new ForbiddenException('Access to other tenants is not allowed');
    }

    return true;
  }
}
