import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './auth.guard';

export const ALLOW_SUPER_ADMIN_KEY = 'allowSuperAdmin';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip tenant check for public routes (e.g., login, register)
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    // If no user (should not happen since AuthGuard runs first), allow pass
    if (!user) {
      return true;
    }

    if (!tenantId && !user.tenantId) {
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

    const effectiveTenantId = user.tenantId || tenantId;

    if (requestTenantId && requestTenantId !== effectiveTenantId) {
      throw new ForbiddenException('Access to other tenants is not allowed');
    }

    return true;
  }
}
