import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('PhysicalExecution Module - E2E Tests', () => {
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
    id: 'e2e-user-physical',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-physical',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'physical_execution:create' } },
        { permission: { code: 'physical_execution:read' } },
        { permission: { code: 'physical_execution:update' } },
      ],
    },
  };

  const mockStage = {
    id: 'stage-1',
    convenioId: 'convenio-1',
    name: 'Fundação',
    plannedPercentage: 25,
    actualPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: [],
  };

  const mockProgress = {
    id: 'progress-1',
    stageId: 'stage-1',
    percentage: 25,
    notes: 'Fundação concluída',
    createdBy: 'user-1',
    createdAt: new Date(),
    stage: { name: 'Fundação' },
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    convenio: { findUnique: jest.fn().mockResolvedValue({ id: 'convenio-1' }) },
    projectStage: {
      create: jest.fn().mockResolvedValue(mockStage),
      findMany: jest.fn().mockResolvedValue([mockStage]),
      findUnique: jest.fn().mockResolvedValue(mockStage),
      update: jest.fn().mockResolvedValue({ ...mockStage, name: 'Superestrutura' }),
      delete: jest.fn().mockResolvedValue(mockStage),
    },
    projectProgress: {
      create: jest.fn().mockResolvedValue(mockProgress),
      findMany: jest.fn().mockResolvedValue([mockProgress]),
    },
    applyTenantFilter: jest.fn((model, where) => ({ ...where, tenantId: mockUser.tenantId })),
    getTenantId: jest.fn().mockReturnValue(mockUser.tenantId),
  };

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    mockUser.passwordHash = await bcrypt.hash('Admin@123', 12);

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
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a stage', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/convenios/convenio-1/stages')
      .set('Authorization', 'Bearer test')
      .send({
        name: 'Fundação',
        plannedPercentage: 25,
      })
      .expect(HttpStatus.CREATED);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Fundação');
  });

  it('should list stages', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convenios/convenio-1/stages')
      .set('Authorization', 'Bearer test')
      .expect(HttpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should get convenio progress', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/convenios/convenio-1/progress')
      .set('Authorization', 'Bearer test')
      .expect(HttpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('overallPercentage');
    expect(response.body.data).toHaveProperty('stages');
    expect(response.body.data).toHaveProperty('recentProgress');
  });

  it('should record progress', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/convenios/convenio-1/progress')
      .set('Authorization', 'Bearer test')
      .send({
        stageId: 'stage-1',
        percentage: 25,
        notes: 'Fundação concluída',
      })
      .expect(HttpStatus.CREATED);

    expect(response.body.success).toBe(true);
    expect(response.body.data.percentage).toBe(25);
  });

  it('should get stage progress history', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/stages/stage-1/progress')
      .set('Authorization', 'Bearer test')
      .expect(HttpStatus.OK);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('should update a stage', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/stages/stage-1')
      .set('Authorization', 'Bearer test')
      .send({ name: 'Superestrutura' })
      .expect(HttpStatus.OK);

    expect(response.body.success).toBe(true);
  });

  it('should delete a stage', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/stages/stage-1')
      .set('Authorization', 'Bearer test')
      .expect(HttpStatus.NO_CONTENT);
  });
});
