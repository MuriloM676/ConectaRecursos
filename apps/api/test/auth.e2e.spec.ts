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

describe('Auth - E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  // In-memory store for Redis mock
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
      redisStore.set(key, {
        value,
        ttl: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
      });
    }),
    del: jest.fn(async (key: string) => {
      redisStore.delete(key);
    }),
    exists: jest.fn(async (key: string) => {
      return redisStore.has(key);
    }),
  };

  // Mock user data for E2E tests
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
        { permission: { code: 'emenda:read' } },
        { permission: { code: 'user:read' } },
        { permission: { code: 'tenant:read' } },
        { permission: { code: 'dashboard:read' } },
        { permission: { code: 'report:generate' } },
      ],
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    const bcrypt = require('bcrypt');
    mockUser.passwordHash = await bcrypt.hash('Admin@123', 12);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    app.useGlobalFilters(
      new HttpExceptionFilter(),
      new ValidationExceptionFilter(),
    );

    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    redis = moduleFixture.get<RedisService>(RedisService);
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });


  // =====================
  // E2E: Full Login Flow
  // =====================
  describe('POST /api/v1/auth/login - E2E Full Flow', () => {
    it('should successfully login and return valid JWT tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          expiresIn: 3600,
        },
      });

      const { accessToken } = response.body.data;

      // Validate JWT format (header.payload.signature)
      expect(accessToken.split('.')).toHaveLength(3);

      // Decode JWT payload to verify claims
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString(),
      );
      expect(payload).toMatchObject({
        sub: 'e2e-user-123',
        email: 'admin@captagov.com',
        tenantId: 'e2e-tenant-123',
        role: 'SUPER_ADMIN',
        permissions: expect.arrayContaining(['emenda:read', 'user:read']),
      });

      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should reject invalid credentials with proper error format', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@email.com', password: 'WrongPass@123' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('data');
    });

    it('should reject inactive users', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('inactive'),
      });
    });
  });


  // =====================
  // E2E: Full Refresh Flow
  // =====================
  describe('POST /api/v1/auth/refresh - E2E Full Flow', () => {
    it('should successfully refresh token and return new access token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);

      const { refreshToken } = loginResponse.body.data;

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(refreshResponse.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.any(String),
        },
      });

      const newAccessToken = refreshResponse.body.data.accessToken;

      // Should be a valid JWT
      expect(newAccessToken.split('.')).toHaveLength(3);

      // Decode and validate new token claims
      const payload = JSON.parse(
        Buffer.from(newAccessToken.split('.')[1], 'base64').toString(),
      );
      expect(payload).toMatchObject({
        sub: 'e2e-user-123',
        email: 'admin@captagov.com',
        tenantId: 'e2e-tenant-123',
        role: 'SUPER_ADMIN',
      });
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should reject reused refresh token (rotation security)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);

      const { refreshToken } = loginResponse.body.data;

      // First use - should succeed
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      // Reuse - should fail
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const reuseResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(reuseResponse.body).toMatchObject({
        success: false,
        message: expect.stringContaining('reused'),
      });
    });
  });

  // =====================
  // E2E: Full Logout Flow
  // =====================
  describe('POST /api/v1/auth/logout - E2E Flow', () => {
    it('should logout and invalidate refresh token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);

      const { refreshToken } = loginResponse.body.data;

      // Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(logoutResponse.body).toMatchObject({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
      });

      // Verify token is invalidated
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });


  // =====================
  // E2E: Forgot / Reset Password Flow
  // =====================
  describe('POST /api/v1/auth/forgot-password - E2E Flow', () => {
    it('should return generic message for registered email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'admin@captagov.com' })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'If the email is registered, reset instructions were sent',
        },
      });
    });

    it('should return same generic message for unregistered email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'unknown@test.com' })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'If the email is registered, reset instructions were sent',
        },
      });
    });
  });

  describe('POST /api/v1/auth/reset-password - E2E Flow', () => {
    it('should reset password with valid token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'admin@captagov.com' })
        .expect(HttpStatus.OK);

      // Find reset token from Redis store
      let resetToken: string | null = null;
      for (const key of redisStore.keys()) {
        if (key.startsWith('password_reset:')) {
          resetToken = key.replace('password_reset:', '');
          break;
        }
      }
      expect(resetToken).toBeTruthy();

      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, password: 'NewSecure@789' })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Password reset successfully',
        },
      });

      expect(redisStore.has(`password_reset:${resetToken}`)).toBe(false);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'e2e-user-123' },
        data: { passwordHash: expect.any(String) },
      });
    });

    it('should reject expired or invalid reset token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewPass@456' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid or expired'),
      });
    });
  });


  // =====================
  // E2E: Validation & Security
  // =====================
  describe('Input Validation - E2E', () => {
    it('should reject login with missing email', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'Admin@123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
      });
      expect(response.body).toHaveProperty('errors');
    });

    it('should reject login with invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'Admin@123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
      });
    });

    it('should reject login with short password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@captagov.com', password: '123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
      });
    });

    it('should reject refresh with missing token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation error',
      });
    });

    it('should return 404 for unknown routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/nonexistent-route')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('statusCode', 404);
      expect(response.body).toHaveProperty('message');
    });
  });
});

