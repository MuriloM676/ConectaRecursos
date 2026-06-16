import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: PrismaService;

  const mockRole = {
    id: 'role-1',
    name: 'ADMIN',
    description: 'Administrator role',
    createdAt: new Date(),
    rolePermissions: [
      {
        permission: {
          id: 'perm-1',
          code: 'role:create',
        },
      },
    ],
  };

  const mockPrisma = {
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rolePermission: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'ADMIN',
      description: 'Administrator role',
      permissionIds: ['perm-1'],
    };

    it('should create a role successfully', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);
      mockPrisma.role.create.mockResolvedValue(mockRole);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockRole.id);
      expect(result.name).toEqual(mockRole.name);
      expect(mockPrisma.role.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when role name already exists', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all roles', async () => {
      mockPrisma.role.findMany.mockResolvedValue([mockRole]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(mockRole.id);
    });
  });

  describe('findById', () => {
    it('should return a role by id', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.findById('role-1');

      expect(result).toBeDefined();
      expect(result.id).toEqual('role-1');
    });

    it('should throw NotFoundException when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'ADMIN_UPDATED',
      permissionIds: ['perm-2'],
    };

    it('should update a role successfully', async () => {
      mockPrisma.role.findUnique.mockResolvedValueOnce(mockRole); // findById
      mockPrisma.role.findUnique.mockResolvedValueOnce(null); // findByName conflict check
      mockPrisma.role.update.mockResolvedValue({ ...mockRole, name: 'ADMIN_UPDATED' });

      const result = await service.update('role-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toEqual('ADMIN_UPDATED');
      expect(mockPrisma.rolePermission.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.rolePermission.createMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a role successfully', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.count.mockResolvedValue(0);

      await service.remove('role-1');

      expect(mockPrisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
    });

    it('should throw ConflictException if role has users assigned', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(mockRole);
      mockPrisma.user.count.mockResolvedValue(1);

      await expect(service.remove('role-1')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
