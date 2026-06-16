import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;

  beforeEach(() => {
    middleware = new TenantMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('should extract tenantId from JWT user', () => {
    const req = {
      user: { tenantId: 'tenant-1' },
      headers: {},
      subdomains: [],
    } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBe('tenant-1');
    expect(next).toHaveBeenCalled();
  });

  it('should extract tenantId from X-Tenant-ID header', () => {
    const req = {
      user: undefined,
      headers: { 'x-tenant-id': 'tenant-2' },
      subdomains: [],
    } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBe('tenant-2');
    expect(next).toHaveBeenCalled();
  });

  it('should prefer JWT user tenantId over header', () => {
    const req = {
      user: { tenantId: 'tenant-jwt' },
      headers: { 'x-tenant-id': 'tenant-header' },
      subdomains: [],
    } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBe('tenant-jwt');
  });

  it('should not set tenantId when no source is available', () => {
    const req = {
      user: undefined,
      headers: {},
      subdomains: [],
    } as any;
    const res = {} as any;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.tenantId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
