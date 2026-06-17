import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('Alerts Module - E2E Tests', () => {
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
    id: 'e2e-user-alert',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-alert',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'alert:read' } },
        { permission: { code: 'alert:manage' } },
      ],
    },
  };

  const mockAlert = {
    id: 'alert-e2e-1',
    tenantId: 'e2e-tenant-alert',
    type: 'IMPEDIMENT_IDENTIFIED',
    title: 'Impedimento identificado',
    description: 'Emenda X possui impedimento',
    read: false,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    alert: {
      create: jest.fn().mockResolvedValue(mockAlert),
      findMany: jest.fn().mockResolvedValue([mockAlert]),
      findUnique: jest.fn().mockResolvedValue(mockAlert),
      update: jest.fn().mockImplementation(({ data }) => ({ ...mockAlert, ...data })),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn().mockResolvedValue(1),
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

  describe('POST /alerts', () => {
    it('should create an alert', async () => {
      const res = await request(app.getHttpServer())
        .post('/alerts')
        .send({
          type: 'IMPEDIMENT_IDENTIFIED',
          title: 'Impedimento identificado',
          description: 'Emenda X possui impedimento',
          recipientIds: ['user-1'],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('IMPEDIMENT_IDENTIFIED');
    });

    it('should return 400 for invalid body', async () => {
      await request(app.getHttpServer())
        .post('/alerts')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for invalid alert type', async () => {
      await request(app.getHttpServer())
        .post('/alerts')
        .send({
          type: 'INVALID_TYPE',
          title: 'Test',
          recipientIds: ['user-1'],
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /alerts', () => {
    it('should list alerts', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /alerts/unread', () => {
    it('should list unread alerts', async () => {
      const res = await request(app.getHttpServer())
        .get('/alerts/unread')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PATCH /alerts/:id/read', () => {
    it('should mark alert as read', async () => {
      mockPrismaService.alert.update.mockResolvedValue({ ...mockAlert, read: true });

      const res = await request(app.getHttpServer())
        .patch('/alerts/alert-e2e-1/read')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.read).toBe(true);
    });
  });

  describe('POST /alerts/read-all', () => {
    it('should mark all alerts as read', async () => {
      const res = await request(app.getHttpServer())
        .post('/alerts/read-all')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('POST /alerts/test', () => {
    it('should create a test alert', async () => {
      mockPrismaService.alert.create.mockResolvedValue({
        ...mockAlert,
        type: 'SYNC_FAILURE',
        title: 'Alerta de Teste',
        description: 'Este é um alerta de teste gerado pelo sistema.',
      });

      const res = await request(app.getHttpServer())
        .post('/alerts/test')
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('SYNC_FAILURE');
    });
  });
});
