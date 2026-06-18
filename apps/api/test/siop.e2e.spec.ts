import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('SIOP Module - E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    id: 'e2e-user-123',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-123',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'siop:sync' } },
        { permission: { code: 'siop:read' } },
        { permission: { code: 'siop:reprocess' } },
      ],
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
    },
    syncJob: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'e2e-tenant-123', document: '00000000000191', name: 'Test Tenant' }),
    },
    parliamentarian: { upsert: jest.fn().mockResolvedValue({ id: 'p-1' }) },
    emenda: { upsert: jest.fn().mockResolvedValue({ id: 'e-1' }) },
    beneficiary: { upsert: jest.fn() },
    impediment: { upsert: jest.fn() },
  };

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    mockUser.passwordHash = await bcrypt.hash('Admin@123', 12);

    mockPrismaService.syncJob.create.mockResolvedValue({
      id: 'sync-job-1', provider: 'SIOP', status: 'RUNNING',
      startedAt: new Date(), finishedAt: null, recordsProcessed: 0,
      errorMessage: null, createdAt: new Date(),
    });
    mockPrismaService.syncJob.findMany.mockResolvedValue([{
      id: 'sync-job-1', provider: 'SIOP', status: 'COMPLETED',
      recordsProcessed: 5, errorMessage: null,
      startedAt: new Date(), finishedAt: new Date(), createdAt: new Date(),
    }]);
    mockPrismaService.syncJob.findUnique.mockResolvedValue({
      id: 'sync-job-1', provider: 'SIOP', status: 'FAILED',
      recordsProcessed: 0, errorMessage: 'API Error',
      startedAt: new Date(), finishedAt: null, createdAt: new Date(),
    });
    mockPrismaService.syncJob.findFirst.mockResolvedValue({
      id: 'sync-job-1', provider: 'SIOP', status: 'COMPLETED',
      recordsProcessed: 5, errorMessage: null,
      startedAt: new Date(), finishedAt: new Date(), createdAt: new Date(),
    });
    mockPrismaService.syncJob.groupBy.mockResolvedValue([
      { status: 'COMPLETED', _count: { status: 3 } },
      { status: 'FAILED', _count: { status: 1 } },
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService).useValue(mockPrismaService)
      .overrideProvider(RedisService).useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }));
    app.useGlobalFilters(new HttpExceptionFilter(), new ValidationExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(() => { redisStore.clear(); jest.clearAllMocks(); });
  afterAll(async () => { await app.close(); });

  describe('GET /api/v1/siop/jobs', () => {
    it('should return list of recent sync jobs', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);
      const { accessToken } = loginResponse.body.data;

      mockPrismaService.syncJob.findMany.mockResolvedValueOnce([{
        id: 'sync-job-1', provider: 'SIOP', status: 'COMPLETED',
        recordsProcessed: 5, errorMessage: null,
        startedAt: new Date(), finishedAt: new Date(), createdAt: new Date(),
      }]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/siop/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/siop/sync-status', () => {
    it('should return sync status information', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);
      const { accessToken } = loginResponse.body.data;

      const response = await request(app.getHttpServer())
        .get('/api/v1/siop/sync-status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('lastSync');
      expect(response.body.data).toHaveProperty('recentJobs');
      expect(response.body.data).toHaveProperty('totals');
    });
  });

  describe('GET /api/v1/siop/jobs/:id', () => {
    it('should return job details', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);
      const { accessToken } = loginResponse.body.data;

      const response = await request(app.getHttpServer())
        .get('/api/v1/siop/jobs/sync-job-1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', 'sync-job-1');
    });

    it('should return 404 for non-existent job', async () => {
      mockPrismaService.syncJob.findUnique.mockResolvedValueOnce(null);
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);
      const { accessToken } = loginResponse.body.data;

      const response = await request(app.getHttpServer())
        .get('/api/v1/siop/jobs/non-existent')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});