import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('Accountability Module - E2E Tests', () => {
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
    id: 'e2e-user-acc',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-acc',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'accountability:create' } },
        { permission: { code: 'accountability:read' } },
        { permission: { code: 'accountability:update' } },
        { permission: { code: 'accountability:approve' } },
        { permission: { code: 'accountability:reject' } },
      ],
    },
  };

  const mockReport = {
    id: 'report-1',
    convenioId: 'conv-1',
    status: 'DRAFT',
    submittedAt: null,
    approvedAt: null,
    notes: 'Prestação referente ao período',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockItem = {
    id: 'item-1',
    reportId: 'report-1',
    description: 'Material de construção',
    amount: 50000,
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    convenio: { findUnique: jest.fn().mockResolvedValue({ id: 'conv-1', number: 'CV-001' }) },
    accountabilityReport: {
      create: jest.fn().mockResolvedValue(mockReport),
      findMany: jest.fn().mockResolvedValue([mockReport]),
      findUnique: jest.fn().mockResolvedValue(mockReport),
      update: jest.fn().mockImplementation(({ data }) => ({ ...mockReport, ...data })),
      count: jest.fn().mockResolvedValue(1),
    },
    accountabilityItem: {
      create: jest.fn().mockResolvedValue(mockItem),
      findMany: jest.fn().mockResolvedValue([mockItem]),
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

  describe('POST /accountability-reports', () => {
    it('should create a report', async () => {
      const res = await request(app.getHttpServer())
        .post('/accountability-reports')
        .send({ convenioId: 'conv-1', notes: 'Prestação referente ao período' })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('should return 400 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/accountability-reports')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /accountability-reports', () => {
    it('should list reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/accountability-reports')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /accountability-reports/:id', () => {
    it('should get a report by ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/accountability-reports/report-1')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('report-1');
    });
  });

  describe('PATCH /accountability-reports/:id', () => {
    it('should update a report', async () => {
      mockPrismaService.accountabilityReport.findUnique.mockResolvedValue(mockReport);

      const res = await request(app.getHttpServer())
        .patch('/accountability-reports/report-1')
        .send({ notes: 'Updated notes' })
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /accountability-reports/:id/submit', () => {
    it('should submit a report', async () => {
      mockPrismaService.accountabilityReport.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.accountabilityReport.update.mockResolvedValue({ ...mockReport, status: 'SUBMITTED', submittedAt: new Date() });

      const res = await request(app.getHttpServer())
        .post('/accountability-reports/report-1/submit')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
    });
  });

  describe('POST /accountability-reports/:id/approve', () => {
    it('should approve a submitted report', async () => {
      mockPrismaService.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'SUBMITTED', submittedAt: new Date() });
      mockPrismaService.accountabilityReport.update.mockResolvedValue({ ...mockReport, status: 'APPROVED', approvedAt: new Date() });

      const res = await request(app.getHttpServer())
        .post('/accountability-reports/report-1/approve')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('POST /accountability-reports/:id/reject', () => {
    it('should reject a submitted report', async () => {
      mockPrismaService.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'SUBMITTED', submittedAt: new Date() });
      mockPrismaService.accountabilityReport.update.mockResolvedValue(mockReport);

      const res = await request(app.getHttpServer())
        .post('/accountability-reports/report-1/reject')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
    });
  });

  describe('GET /accountability-reports/:id/items', () => {
    it('should list items', async () => {
      const res = await request(app.getHttpServer())
        .get('/accountability-reports/report-1/items')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /accountability-reports/:id/items', () => {
    it('should add item to report', async () => {
      mockPrismaService.accountabilityReport.findUnique.mockResolvedValue(mockReport);

      const res = await request(app.getHttpServer())
        .post('/accountability-reports/report-1/items')
        .send({ description: 'Material de construção', amount: 50000 })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
    });
  });
});
