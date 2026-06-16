import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisService } from '@modules/redis/redis.service';
import { PasswordHashService } from './services/password-hash.service';
import { JwtConfig } from '@config/jwt.config';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let redis: RedisService;
  let passwordHash: PasswordHashService;
  let jwtConfig: JwtConfig;

  const mockJwtConfig = {
    secret: 'test-secret',
    expiresIn: 3600,
    refreshSecret: 'test-refresh-secret',
    refreshExpiresIn: 604800,
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@test.com',
    tenantId: 'tenant-1',
    name: 'Test User',
    passwordHash: '$2b$12$hashedpassword',
    active: true,
    lastLogin: null,
    role: {
      name: 'ADMIN_MUNICIPAL',
      rolePermissions: [
        { permission: { code: 'emenda:read' } },
        { permission: { code: 'user:read' } },
      ],
    },
  };


  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  };

  const mockPasswordHashService = {
    hash: jest.fn(),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: PasswordHashService, useValue: mockPasswordHashService },
        { provide: JwtConfig, useValue: mockJwtConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    redis = module.get<RedisService>(RedisService);
    passwordHash = module.get<PasswordHashService>(PasswordHashService);
    jwtConfig = module.get<JwtConfig>(JwtConfig);

    // Default mock implementations
    mockJwtService.sign.mockImplementation((payload, options) => {
      if (options?.secret === mockJwtConfig.refreshSecret) {
        return 'mock-refresh-token';
      }
      return 'mock-access-token';
    });

    mockJwtService.verify.mockImplementation((token, _options) => {
      if (token === 'valid-refresh-token') {
        return { sub: 'user-1', type: 'refresh' };
      }
      if (token === 'reused-refresh-token') {
        return { sub: 'user-1', type: 'refresh' };
      }
      if (token === 'expired-refresh-token') {
        throw new Error('jwt expired');
      }
      if (token === 'invalid-token-type') {
        return { sub: 'user-1', type: 'access' };
      }
      throw new Error('invalid token');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });


  // ===================== T040: LOGIN =====================
  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'user@test.com',
      password: 'Test@123',
    };

    it('should return tokens when credentials are valid (AUTH-001)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordHashService.compare.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.login(loginDto, '127.0.0.1');

      expect(result).toHaveProperty('accessToken', 'mock-access-token');
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { lastLogin: expect.any(Date) },
      });
    });

    it('should throw UnauthorizedException when email does not exist (AUTH-001)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw UnauthorizedException when user is inactive (AUTH-001)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'User account is inactive',
      );
    });

    it('should throw UnauthorizedException when password is incorrect (AUTH-001)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordHashService.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should track failed login attempts and lock account after 5 failures (AUTH-001)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordHashService.compare.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('4');

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Account temporarily locked',
      );
    });

    it('should clear failed login attempts on successful login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordHashService.compare.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.login(loginDto, '127.0.0.1');

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'login_attempts:user-1',
      );
    });

    it('should include user permissions in generated tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordHashService.compare.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-1',
          email: 'user@test.com',
          tenantId: 'tenant-1',
          role: 'ADMIN_MUNICIPAL',
          permissions: ['emenda:read', 'user:read'],
        }),
        expect.any(Object),
      );
    });

    it('should store refresh token in Redis', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordHashService.compare.mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'refresh_token:mock-refresh-token',
        'user-1',
        604800,
      );
    });
  });


  // ===================== T041: REFRESH TOKEN =====================
  describe('refresh', () => {
    it('should return new access token when refresh token is valid (AUTH-002)', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', expect.any(String));
    });

    it('should throw UnauthorizedException when refresh token is expired (AUTH-002)', async () => {
      await expect(
        service.refresh('expired-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh('expired-refresh-token'),
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw UnauthorizedException when refresh token is reused (AUTH-002)', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(
        service.refresh('reused-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh('reused-refresh-token'),
      ).rejects.toThrow(
        'Refresh token has been reused. All sessions invalidated.',
      );
    });

    it('should invalidate the used refresh token (rotation)', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await service.refresh('valid-refresh-token');

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'refresh_token:valid-refresh-token',
      );
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      await expect(
        service.refresh('invalid-token-type'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh('invalid-token-type'),
      ).rejects.toThrow('Invalid token type');
    });

    it('should throw UnauthorizedException when stored userId does not match token sub', async () => {
      mockRedisService.get.mockResolvedValue('different-user');

      await expect(
        service.refresh('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found or inactive', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh('valid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refresh('valid-refresh-token'),
      ).rejects.toThrow('User not found or inactive');
    });
  });


  // ===================== T042: LOGOUT =====================
  describe('logout', () => {
    it('should remove refresh token from Redis', async () => {
      await service.logout('some-refresh-token');

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'refresh_token:some-refresh-token',
      );
    });

    it('should return success message', async () => {
      const result = await service.logout('some-refresh-token');

      expect(result).toHaveProperty('message', 'Logged out successfully');
    });
  });

  // ===================== T043: FORGOT PASSWORD =====================
  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'user@test.com',
    };

    it('should generate reset token when email is registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'If the email is registered, reset instructions were sent',
      );
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.stringContaining('password_reset:'),
        'user-1',
        1800,
      );
    });

    it('should return generic message even when email is not registered (security)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'If the email is registered, reset instructions were sent',
      );
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });

    it('should return generic message when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'If the email is registered, reset instructions were sent',
      );
      expect(mockRedisService.set).not.toHaveBeenCalled();
    });
  });

  // ===================== T044: RESET PASSWORD =====================
  describe('resetPassword', () => {
    const resetPasswordDto: ResetPasswordDto = {
      token: 'valid-reset-token',
      password: 'NewPass@456',
    };

    it('should update password when token is valid', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPasswordHashService.hash.mockResolvedValue('new-hashed-password');
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toHaveProperty(
        'message',
        'Password reset successfully',
      );
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { passwordHash: 'new-hashed-password' },
      });
    });

    it('should throw BadRequestException when token is invalid or expired', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(
        service.resetPassword(resetPasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should delete the reset token after use', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPasswordHashService.hash.mockResolvedValue('new-hashed-password');
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.resetPassword(resetPasswordDto);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'password_reset:valid-reset-token',
      );
    });

    it('should invalidate all user tokens after password reset', async () => {
      mockRedisService.get.mockResolvedValue('user-1');
      mockPasswordHashService.hash.mockResolvedValue('new-hashed-password');
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      await service.resetPassword(resetPasswordDto);

      expect(mockRedisService.del).toHaveBeenCalledWith(
        'password_reset:valid-reset-token',
      );
    });
  });
});
