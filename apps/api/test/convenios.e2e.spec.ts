import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('Convenios Module - E2E Tests', () => {
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
    id: 'e2e-user-convenio',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-convenio',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'convenio:create' } },
        { permission: { code: 'convenio:read' } },
        { permission: { code: 'convenio:update' } },
        { permission: { code: 'convenio:delete' } },
        { permission: { code: 'financial_schedule:create' } },
      ],
    },
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    emenda: { findUnique: jest.fn().mockResolvedValue({ id: 'emenda-1' }) },
    convenio: {
      create: jest
        .fn()
        .mockResolvedValue({
          id: 'convenio-1',
          tenantId: mockUser.tenantId,
          emendaId: 'emenda-1',
          number: 'CV-2026-001',
          object: 'Construção de UBS',
          totalAmount: 2500000,
          counterpartAmount: 200000,
          startDate: '2026-01-01',
          endDate: '2027-01-01',
          status: 'DRAFT',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          emenda: { number: '20260001' },
        }),
      findMany: jest
        .fn()
        .mockResolvedValue([
          {
            id: 'convenio-1',
            tenantId: mockUser.tenantId,
            emendaId: 'emenda-1',
            number: 'CV-2026-001',
            object: 'Construção de UBS',
            totalAmount: 2500000,
            counterpartAmount: 200000,
            startDate: '2026-01-01',
            endDate: '2027-01-01',
            status: 'DRAFT',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
            emenda: { number: '20260001' },
          },
        ]),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn(),
    },
    convenioFinancialSchedule: {
      create: jest.fn().mockResolvedValue({
        id: 'schedule-1',
        convenioId: 'convenio-1',
        expectedAmount: 500000,
        expectedDate: '2026-09-01',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
  };

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    mockUser.passwordHash = await bcrypt.hash('Admin@123', 12);

    mockPrismaService.convenio.findFirst.mockResolvedValue({
      id: 'convenio-1',
      tenantId: mockUser.tenantId,
      emendaId: 'emenda-1',
      number: 'CV-2026-001',
      object: 'Construção de UBS',
      totalAmount: 2500000,
      counterpartAmount: 200000,
      startDate: '2026-01-01',
      endDate: '2027-01-01',
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      emenda: { number: '20260001' },
    });

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

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create convenio', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/convenios')
      .set('Authorization', 'Bearer test')
      .send({
        emendaId: 'emenda-1',
        number: 'CV-2026-001',
        object: 'Construção de UBS',
        totalAmount: 2500000,
        counterpartAmount: 200000,
        status: 'DRAFT',
      })
      .expect(HttpStatus.CREATED);

    expect(response.body.success).toBe(true);
    expect(response.body.data.number).toBe('CV-2026-001');
  });

  it('should list convenios', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convenios')
      .set('Authorization', 'Bearer test')
      .expect(HttpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.items)).toBe(true);
  });

  it('should get convenio by id', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convenios/convenio-1')
      .set('Authorization', 'Bearer test')
      .expect(HttpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe('convenio-1');
  });

  it('should add schedule item', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/convenios/convenio-1/schedule')
      .set('Authorization', 'Bearer test')
      .send({
        expectedAmount: 500000,
        expectedDate: '2026-09-01',
      })
      .expect(HttpStatus.CREATED);

    expect(response.body.success).toBe(true);
  });
});
