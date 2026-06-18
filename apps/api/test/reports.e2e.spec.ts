import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: Function) {
      if (event === 'finish') cb();
      return this;
    }),
    end: jest.fn(),
  }),
}));

jest.mock('pdfkit', () => {
  const MockPDFDocument = jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: Function) {
      if (event === 'finish') setTimeout(cb, 0);
      return this;
    }),
    end: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    addPage: jest.fn(),
    page: { width: 595, height: 842 },
    y: 100,
  }));
  return MockPDFDocument;
});

describe('Reports Module - E2E Tests', () => {
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
    id: 'e2e-user-rpt',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-rpt',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'report:generate' } },
        { permission: { code: 'report:read' } },
      ],
    },
  };

  const mockReport = {
    id: 'rpt-e2e-1',
    tenantId: 'e2e-tenant-rpt',
    reportType: 'EMENDAS',
    format: 'PDF',
    generatedBy: 'e2e-user-rpt',
    filePath: '/tmp/test-report.pdf',
    generatedAt: new Date(),
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    generatedReport: {
      create: jest.fn().mockResolvedValue(mockReport),
      findMany: jest.fn().mockResolvedValue([mockReport]),
      findUnique: jest.fn().mockResolvedValue(mockReport),
      count: jest.fn().mockResolvedValue(1),
    },
    emenda: { findMany: jest.fn().mockResolvedValue([]) },
    convenio: { findMany: jest.fn().mockResolvedValue([]) },
    impediment: { findMany: jest.fn().mockResolvedValue([]) },
    convenioFinancialSchedule: { findMany: jest.fn().mockResolvedValue([]) },
    projectStage: { findMany: jest.fn().mockResolvedValue([]) },
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

  describe('POST /reports/generate', () => {
    it('should generate a PDF report', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports/generate?type=EMENDAS&format=PDF')
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.reportType).toBe('EMENDAS');
    });

    it('should generate a CSV report', async () => {
      const res = await request(app.getHttpServer())
        .post('/reports/generate?type=EMENDAS&format=CSV')
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.format).toBe('PDF');
    });

    it('should return 400 for invalid format', async () => {
      await request(app.getHttpServer())
        .post('/reports/generate?type=EMENDAS&format=INVALID')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /reports', () => {
    it('should list reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/reports')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /reports/:id/download', () => {
    it('should download a report', async () => {
      const { readFile } = jest.requireActual('fs/promises');
      jest.spyOn(jest.requireActual('fs/promises'), 'readFile').mockResolvedValue(Buffer.from('test'));

      const res = await request(app.getHttpServer())
        .get('/reports/rpt-e2e-1/download')
        .expect(HttpStatus.OK);

      expect(res.headers['content-type']).toBe('application/pdf');
    });
  });
});
