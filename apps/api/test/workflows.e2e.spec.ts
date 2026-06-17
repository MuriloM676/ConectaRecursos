import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('Workflows Module - E2E Tests', () => {
  let app: INestApplication;

  const redisStore = new Map<string, { value: string; ttl: number }>();

  const mockRedisService = {
    get: jest.fn(async (key: string) => {
      const entry = redisStore.get(key);
      if (!entry) return null;
      if (entry.ttl && Date.now() > entry.ttl) {
        redisStore.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: jest.fn(async (key: string, value: string, ttlSeconds?: number) => {
      redisStore.set(key, { value, ttl: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
    }),
    del: jest.fn(async (key: string) => { redisStore.delete(key); }),
    exists: jest.fn(async (key: string) => redisStore.has(key)),
  };

  const mockUser = {
    id: 'e2e-user-wf',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-wf',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'integration:create' } },
        { permission: { code: 'integration:read' } },
        { permission: { code: 'integration:update' } },
        { permission: { code: 'accountability:approve' } },
        { permission: { code: 'accountability:reject' } },
      ],
    },
  };

  const mockWorkflow = {
    id: 'wf-1',
    tenantId: mockUser.tenantId,
    name: 'Fluxo Prestação de Contas',
    createdAt: new Date(),
  };

  const mockStep = {
    id: 'step-1',
    workflowId: 'wf-1',
    stepOrder: 1,
    approverRole: 'GESTOR',
  };

  const mockApproval = {
    id: 'approval-1',
    workflowId: 'wf-1',
    entityType: 'ACCOUNTABILITY_REPORT',
    entityId: 'report-1',
    status: 'PENDING',
    approvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    approvalWorkflow: {
      create: jest.fn().mockResolvedValue(mockWorkflow),
      findMany: jest.fn().mockResolvedValue([mockWorkflow]),
      findUnique: jest.fn().mockResolvedValue(mockWorkflow),
    },
    approvalStep: {
      create: jest.fn().mockResolvedValue(mockStep),
      findMany: jest.fn().mockResolvedValue([mockStep]),
    },
    approval: {
      findUnique: jest.fn().mockResolvedValue(mockApproval),
      update: jest.fn().mockImplementation(({ data }) => ({ ...mockApproval, ...data })),
    },
    getTenantId: jest.fn(() => mockUser.tenantId),
    setTenantId: jest.fn(),
    clearTenantId: jest.fn(),
    applyTenantFilter: jest.fn((_model, where) => where || {}),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(), new ValidationExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /workflows', () => {
    it('should create a workflow', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflows')
        .send({ name: 'Fluxo Prestação de Contas' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Fluxo Prestação de Contas');
    });

    it('should return 400 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/workflows')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /workflows', () => {
    it('should list workflows', async () => {
      const res = await request(app.getHttpServer())
        .get('/workflows')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /workflows/:id/steps', () => {
    it('should add a step', async () => {
      const res = await request(app.getHttpServer())
        .post('/workflows/wf-1/steps')
        .send({ stepOrder: 1, approverRole: 'GESTOR' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.approverRole).toBe('GESTOR');
    });
  });

  describe('GET /workflows/:id/steps', () => {
    it('should list steps', async () => {
      const res = await request(app.getHttpServer())
        .get('/workflows/wf-1/steps')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /approvals/:id/approve', () => {
    it('should approve a pending approval', async () => {
      mockPrismaService.approval.update.mockResolvedValue({ ...mockApproval, status: 'APPROVED', approvedBy: 'e2e-user-wf' });

      const res = await request(app.getHttpServer())
        .post('/approvals/approval-1/approve')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('POST /approvals/:id/reject', () => {
    it('should reject a pending approval', async () => {
      mockPrismaService.approval.update.mockResolvedValue({ ...mockApproval, status: 'REJECTED', approvedBy: 'e2e-user-wf' });

      const res = await request(app.getHttpServer())
        .post('/approvals/approval-1/reject')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REJECTED');
    });
  });
});
