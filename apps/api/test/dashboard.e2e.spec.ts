import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('Dashboard Module - E2E Tests', () => {
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
    id: 'e2e-user-dash',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-dash',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'dashboard:read' } },
      ],
    },
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    emenda: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 1000000 }, _count: 10 }),
      findMany: jest.fn().mockResolvedValue([
        { status: 'APPROVED', amount: 500000 },
        { status: 'PENDING', amount: 300000 },
        { type: 'INDIVIDUAL', amount: 600000 },
        { type: 'BANCADA', amount: 400000 },
        { id: 'e1', amount: 500000, parliamentarian: { id: 'p1', name: 'Dep A', party: 'XYZ', state: 'SP' } },
        { id: 'e2', amount: 300000, parliamentarian: { id: 'p2', name: 'Dep B', party: 'ABC', state: 'RJ' } },
      ]),
    },
    convenio: { count: jest.fn().mockResolvedValue(5) },
    impediment: { count: jest.fn().mockResolvedValue(2) },
    convenioFinancialSchedule: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { receivedAmount: 400000 } }),
      findMany: jest.fn().mockResolvedValue([
        { expectedAmount: 500000, expectedDate: new Date('2026-01-15'), receivedAmount: 200000 },
        { expectedAmount: 300000, expectedDate: new Date('2026-02-10'), receivedAmount: null },
      ]),
    },
    projectStage: { aggregate: jest.fn().mockResolvedValue({ _avg: { actualPercentage: 50 } }) },
    getTenantId: jest.fn(() => mockUser.tenantId),
    setTenantId: jest.fn(),
    clearTenantId: jest.fn(),
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

  describe('GET /dashboard/overview', () => {
    it('should return overview data', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.capturedAmount).toBe(1000000);
      expect(res.body.data.receivedAmount).toBe(400000);
      expect(res.body.data.activeConvenios).toBe(5);
      expect(res.body.data.openImpediments).toBe(2);
    });
  });

  describe('GET /dashboard/emendas', () => {
    it('should return emendas grouped by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/emendas')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /dashboard/parliamentarians', () => {
    it('should return top parliamentarians', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/parliamentarians')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /dashboard/areas', () => {
    it('should return areas summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/areas')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /dashboard/financial', () => {
    it('should return financial summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard/financial')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalExpected).toBeDefined();
      expect(res.body.data.totalReceived).toBeDefined();
    });
  });
});
