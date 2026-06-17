import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { StorageService } from '../src/modules/documents/storage.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';

describe('Documents Module - E2E Tests', () => {
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
    id: 'e2e-user-doc',
    email: 'admin@captagov.com',
    tenantId: 'e2e-tenant-doc',
    name: 'Super Admin',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'document:upload' } },
        { permission: { code: 'document:read' } },
        { permission: { code: 'document:delete' } },
      ],
    },
  };

  const mockDoc = {
    id: 'doc-e2e-1',
    tenantId: 'e2e-tenant-doc',
    entityType: 'CONVENIO',
    entityId: 'conv-1',
    fileName: 'relatorio.pdf',
    filePath: '/uploads/doc-e2e-1.pdf',
    mimeType: 'application/pdf',
    version: 1,
    uploadedBy: 'e2e-user-doc',
    createdAt: new Date(),
    deletedAt: null,
  };

  const mockPrismaService = {
    user: { findUnique: jest.fn().mockResolvedValue(mockUser), update: jest.fn().mockResolvedValue(mockUser) },
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: mockUser.tenantId, document: '00000000000000', name: 'Test Tenant' }) },
    document: {
      create: jest.fn().mockResolvedValue(mockDoc),
      findMany: jest.fn().mockResolvedValue([mockDoc]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(mockDoc),
      update: jest.fn().mockResolvedValue({ ...mockDoc, deletedAt: new Date() }),
      count: jest.fn().mockResolvedValue(1),
    },
    getTenantId: jest.fn(() => mockUser.tenantId),
    setTenantId: jest.fn(),
    clearTenantId: jest.fn(),
    applyTenantFilter: jest.fn((_model, where) => where || {}),
  };

  const mockStorageService = {
    saveFile: jest.fn().mockResolvedValue({ filePath: '/uploads/doc-e2e-1.pdf', fileName: 'doc-e2e-1.pdf' }),
    getFile: jest.fn().mockResolvedValue(Buffer.from('test-content')),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(StorageService)
      .useValue(mockStorageService)
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

  describe('POST /documents/upload', () => {
    it('should upload a file', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents/upload?entityType=CONVENIO&entityId=conv-1')
        .attach('file', Buffer.from('test-pdf-content'), 'relatorio.pdf')
        .expect(HttpStatus.CREATED);

      expect(res.body.success).toBe(true);
      expect(res.body.data.fileName).toBe('relatorio.pdf');
      expect(res.body.data.version).toBe(1);
    });

    it('should return 400 when file is missing', async () => {
      await request(app.getHttpServer())
        .post('/documents/upload?entityType=CONVENIO&entityId=conv-1')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /documents', () => {
    it('should list documents', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('GET /documents/:id', () => {
    it('should get document by ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents/doc-e2e-1')
        .expect(HttpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('doc-e2e-1');
    });
  });

  describe('GET /documents/:id/download', () => {
    it('should download a document', async () => {
      const res = await request(app.getHttpServer())
        .get('/documents/doc-e2e-1/download')
        .expect(HttpStatus.OK);

      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('relatorio.pdf');
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should soft-delete a document', async () => {
      await request(app.getHttpServer())
        .delete('/documents/doc-e2e-1')
        .expect(HttpStatus.NO_CONTENT);
    });
  });
});
