import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { JwtConfig } from '@config/jwt.config';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: PrismaService;

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
    active: true,
    role: {
      name: 'ADMIN_MUNICIPAL',
      rolePermissions: [
        {
          permission: { code: 'emenda:read' },
        },
        {
          permission: { code: 'user:read' },
        },
      ],
    },
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: JwtConfig, useValue: mockJwtConfig },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user payload when user is found and active', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const payload = {
        sub: 'user-1',
        email: 'user@test.com',
        tenantId: 'tenant-1',
        role: 'ADMIN_MUNICIPAL',
        permissions: [],
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'user-1',
        email: 'user@test.com',
        tenantId: 'tenant-1',
        role: 'ADMIN_MUNICIPAL',
        permissions: ['emenda:read', 'user:read'],
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const payload = {
        sub: 'nonexistent',
        email: 'unknown@test.com',
        tenantId: 'tenant-1',
        role: 'ADMIN_MUNICIPAL',
        permissions: [],
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const payload = {
        sub: 'user-1',
        email: 'user@test.com',
        tenantId: 'tenant-1',
        role: 'ADMIN_MUNICIPAL',
        permissions: [],
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User is inactive',
      );
    });

    it('should call prisma with correct parameters', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const payload = {
        sub: 'user-1',
        email: 'user@test.com',
        tenantId: 'tenant-1',
        role: 'ADMIN_MUNICIPAL',
        permissions: [],
      };

      await strategy.validate(payload);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
    });
  });
});
