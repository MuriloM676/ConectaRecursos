import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@config/config.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisModule } from '@modules/redis/redis.module';
import { RedisService } from '@modules/redis/redis.service';
import { JwtConfig } from '@config/jwt.config';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '@common/filters/validation-exception.filter';
import { AuthGuard } from '@common/guards/auth.guard';

describe('Auth Module - Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let jwtService: JwtService;

  const mockJwtConfig = {
    secret: 'test-integration-secret-key',
    expiresIn: 3600,
    refreshSecret: 'test-integration-refresh-secret-key',
    refreshExpiresIn: 604800,
  };

  const mockUser = {
    id: 'user-123',
    email: 'admin@captagov.com',
    tenantId: 'tenant-123',
    name: 'Admin User',
    passwordHash: '',
    active: true,
    lastLogin: null,
    role: {
      name: 'SUPER_ADMIN',
      rolePermissions: [
        { permission: { code: 'emenda:read' } },
        { permission: { code: 'user:read' } },
        { permission: { code: 'tenant:read' } },
      ],
    },
  };

  // In-memory Redis mock for integration testing
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

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    // Set password hash for mock user
    const bcrypt = require('bcrypt');
    mockUser.passwordHash = await bcrypt.hash('Admin@123', 12);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, ConfigModule, PrismaModule, RedisModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(JwtConfig)
      .useValue(mockJwtConfig)
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes, filters, and interceptors (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
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
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    redisStore.clear();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });


  // ===================== POST /auth/login =====================
  describe('POST /auth/login', () => {
    const loginEndpoint = '/auth/login';

    it('should return 200 and tokens when credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('data');

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 3600);

      expect(response.body.data.accessToken).toMatch(/^eyJ/);
      expect(response.body.data.refreshToken).toMatch(/^eyJ/);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it('should return 401 when email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ email: 'nonexistent@test.com', password: 'Admin@123' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 401 when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ email: 'admin@captagov.com', password: 'Admin@123' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('inactive');
    });

    it('should return 401 when password is incorrect', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ email: 'admin@captagov.com', password: 'WrongPass@123' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ password: 'Admin@123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ email: 'invalid-email', password: 'Admin@123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 when password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ email: 'admin@captagov.com', password: '123' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });
  });


  // ===================== POST /auth/refresh =====================
  describe('POST /auth/refresh', () => {
    const refreshEndpoint = '/auth/refresh';

    it('should return 200 and new access token for valid refresh token', async () => {
      const refreshToken = jwtService.sign(
        { sub: 'user-123', type: 'refresh' },
        { secret: mockJwtConfig.refreshSecret, expiresIn: '7d' },
      );
      await mockRedisService.set(
        `refresh_token:${refreshToken}`,
        'user-123',
        604800,
      );
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post(refreshEndpoint)
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.accessToken).toMatch(/^eyJ/);

      const exists = await mockRedisService.exists(
        `refresh_token:${refreshToken}`,
      );
      expect(exists).toBe(false);
    });

    it('should return 401 for expired refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post(refreshEndpoint)
        .send({
          refreshToken:
            'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInR5cGUiOiJyZWZyZXNoIiwiZXhwIjoxNTAwMDAwMDAwfQ.expired',
        })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 when refresh token is not provided', async () => {
      const response = await request(app.getHttpServer())
        .post(refreshEndpoint)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  // ===================== POST /auth/logout =====================
  describe('POST /auth/logout', () => {
    const logoutEndpoint = '/auth/logout';

    it('should return 200 and success message', async () => {
      const refreshToken = 'some-valid-refresh-token';
      await mockRedisService.set(
        `refresh_token:${refreshToken}`,
        'user-123',
        604800,
      );

      const response = await request(app.getHttpServer())
        .post(logoutEndpoint)
        .send({ refreshToken })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty(
        'message',
        'Logged out successfully',
      );

      const exists = await mockRedisService.exists(
        `refresh_token:${refreshToken}`,
      );
      expect(exists).toBe(false);
    });

    it('should return 400 when refresh token not provided', async () => {
      const response = await request(app.getHttpServer())
        .post(logoutEndpoint)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });
  });


  // ===================== POST /auth/forgot-password =====================
  describe('POST /auth/forgot-password', () => {
    const forgotEndpoint = '/auth/forgot-password';

    it('should return 200 and generic message when email is registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post(forgotEndpoint)
        .send({ email: 'admin@captagov.com' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty(
        'message',
        'If the email is registered, reset instructions were sent',
      );
    });

    it('should return 200 and same generic message when email is not registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post(forgotEndpoint)
        .send({ email: 'unknown@test.com' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty(
        'message',
        'If the email is registered, reset instructions were sent',
      );
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app.getHttpServer())
        .post(forgotEndpoint)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  // ===================== POST /auth/reset-password =====================
  describe('POST /auth/reset-password', () => {
    const resetEndpoint = '/auth/reset-password';

    it('should return 200 and success message for valid token', async () => {
      const resetToken = 'valid-reset-uuid-token';
      await mockRedisService.set(
        `password_reset:${resetToken}`,
        'user-123',
        1800,
      );
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post(resetEndpoint)
        .send({ token: resetToken, password: 'NewPass@456' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty(
        'message',
        'Password reset successfully',
      );

      const exists = await mockRedisService.exists(
        `password_reset:${resetToken}`,
      );
      expect(exists).toBe(false);
    });

    it('should return 400 for invalid reset token', async () => {
      const response = await request(app.getHttpServer())
        .post(resetEndpoint)
        .send({
          token: 'invalid-token',
          password: 'NewPass@456',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 when password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post(resetEndpoint)
        .send({
          token: 'some-token',
          password: '123',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 when token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post(resetEndpoint)
        .send({ password: 'NewPass@456' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});

