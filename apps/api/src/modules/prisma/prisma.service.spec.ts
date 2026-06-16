import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService - Tenant Filter', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setTenantId / getTenantId', () => {
    it('should set and get tenant ID', () => {
      service.setTenantId('tenant-1');
      expect(service.getTenantId()).toBe('tenant-1');
    });

    it('should clear tenant ID', () => {
      service.setTenantId('tenant-1');
      service.clearTenantId();
      expect(service.getTenantId()).toBeNull();
    });
  });

  describe('applyTenantFilter', () => {
    beforeEach(() => {
      service.setTenantId('tenant-1');
    });

    afterEach(() => {
      service.clearTenantId();
    });

    it('should add tenantId filter for tenant-scoped models', () => {
      const where = { status: 'ACTIVE' };
      const result = service.applyTenantFilter('user', where);

      expect(result).toEqual({
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });
    });

    it('should not add tenantId for non-scoped models', () => {
      const where = { name: 'Role1' };
      const result = service.applyTenantFilter('role', where);

      expect(result).toEqual({ name: 'Role1' });
    });

    it('should not override existing tenantId filter', () => {
      const where = { tenantId: 'tenant-2', status: 'ACTIVE' };
      const result = service.applyTenantFilter('user', where);

      // Should keep original tenantId if explicitly provided
      expect(result).toEqual({
        tenantId: 'tenant-2',
        status: 'ACTIVE',
      });
    });

    it('should return undefined when where is undefined and no tenant context', () => {
      service.clearTenantId();
      const result = service.applyTenantFilter('user', undefined);
      expect(result).toBeUndefined();
    });

    it('should add tenantId to empty where clause', () => {
      const result = service.applyTenantFilter('emenda', {});
      expect(result).toEqual({ tenantId: 'tenant-1' });
    });

    it('should support all tenant-scoped models', () => {
      const models = [
        'user', 'emenda', 'convenio', 'document',
        'alert', 'integration', 'auditlog',
        'generatedreport', 'approvalworkflow', 'dashboardmetric',
      ];

      for (const model of models) {
        const result = service.applyTenantFilter(model, {});
        expect(result).toEqual({ tenantId: 'tenant-1' });
      }
    });

    it('should not add tenantId when no tenant is set', () => {
      service.clearTenantId();
      const where = { status: 'ACTIVE' };
      const result = service.applyTenantFilter('user', where);

      expect(result).toEqual({ status: 'ACTIVE' });
    });
  });
});
