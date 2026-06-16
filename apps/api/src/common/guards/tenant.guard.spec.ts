import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard, ALLOW_SUPER_ADMIN_KEY } from './tenant.guard';
import { IS_PUBLIC_KEY } from './auth.guard';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  const mockContext = (overrides: any = {}) => {
    const user = overrides.user || { tenantId: 'tenant-1', role: 'ADMIN' };
    const request = {
      user,
      tenantId: overrides.requestTenantId || 'tenant-1',
      params: overrides.params || {},
      body: overrides.body || {},
      query: overrides.query || {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => {},
      getClass: () => {},
    } as any;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access for public routes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return true;
      return false;
    });

    const context = mockContext({ user: null });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has no tenantId and no request tenantId', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: undefined, role: 'ADMIN' },
      requestTenantId: undefined,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when no tenant context found for authenticated user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: undefined, role: 'ADMIN' },
      requestTenantId: undefined,
      body: {},
    });

    // Remove tenantId from request
    const req = context.switchToHttp().getRequest();
    delete req.tenantId;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow SUPER_ADMIN access when AllowSuperAdmin is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === IS_PUBLIC_KEY) return false;
      if (key === ALLOW_SUPER_ADMIN_KEY) return true;
      return false;
    });

    const context = mockContext({
      user: { tenantId: 'tenant-1', role: 'SUPER_ADMIN' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should block cross-tenant access via params', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: 'tenant-1', role: 'ADMIN' },
      params: { tenantId: 'tenant-2' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should block cross-tenant access via body', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: 'tenant-1', role: 'ADMIN' },
      body: { tenantId: 'tenant-2' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should block cross-tenant access via query', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: 'tenant-1', role: 'ADMIN' },
      query: { tenantId: 'tenant-2' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user tenant matches request tenant', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: 'tenant-1', role: 'ADMIN' },
      params: { tenantId: 'tenant-1' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when no specific tenantId is in request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const context = mockContext({
      user: { tenantId: 'tenant-1', role: 'ADMIN' },
      requestTenantId: 'tenant-1',
      params: {},
      body: {},
      query: {},
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
