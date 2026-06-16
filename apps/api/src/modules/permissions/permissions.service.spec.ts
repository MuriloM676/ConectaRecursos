import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  const mockPermission = {
    id: 'perm-1',
    code: 'role:create',
    description: 'Allow creating roles',
    createdAt: new Date(),
  };

  const mockPrisma = {
    permission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      mockPrisma.permission.findMany.mockResolvedValue([mockPermission]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(mockPermission.id);
      expect(result[0].code).toEqual(mockPermission.code);
    });
  });

  describe('findById', () => {
    it('should return a permission by id', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.findById('perm-1');

      expect(result).toBeDefined();
      expect(result.id).toEqual('perm-1');
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('should return a permission by code', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(mockPermission);

      const result = await service.findByCode('role:create');

      expect(result).toBeDefined();
      expect(result.code).toEqual('role:create');
    });

    it('should throw NotFoundException when permission code not found', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.findByCode('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRolesByPermission', () => {
    it('should return roles that have the permission', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue({
        ...mockPermission,
        rolePermissions: [
          {
            role: {
              id: 'role-1',
              name: 'ADMIN',
            },
          },
        ],
      });

      const result = await service.getRolesByPermission('perm-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual('role-1');
      expect(result[0].name).toEqual('ADMIN');
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPrisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.getRolesByPermission('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
