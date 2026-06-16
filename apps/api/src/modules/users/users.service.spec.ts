import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { PasswordHashService } from '@modules/auth/services/password-hash.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let passwordHashService: PasswordHashService;

  const mockUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roleId: 'role-1',
    name: 'João Silva',
    email: 'joao.silva@example.com',
    passwordHash: 'hashed-password',
    active: true,
    lastLogin: null,
    createdAt: new Date(),
    role: { name: 'OPERADOR' },
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    getTenantId: jest.fn().mockReturnValue('tenant-1'),
    applyTenantFilter: jest.fn((model, where) => ({ ...where, tenantId: 'tenant-1' })),
  };

  const mockPasswordHashService = {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: PasswordHashService,
          useValue: mockPasswordHashService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    passwordHashService = module.get<PasswordHashService>(PasswordHashService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'João Silva',
      email: 'joao.silva@example.com',
      password: 'Password@123',
      roleId: 'role-1',
    };

    it('should create a user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-1' });
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.email).toEqual(createDto.email);
      expect(mockPasswordHashService.hash).toHaveBeenCalledWith(createDto.password);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toEqual(1);
      expect(result.page).toEqual(1);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById('user-1');

      expect(result).toBeDefined();
      expect(result.id).toEqual('user-1');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'João Silva Updated',
    };

    it('should update a user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, name: 'João Silva Updated' });

      const result = await service.update('user-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toEqual('João Silva Updated');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a user successfully', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await service.remove('user-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({ active: false }),
      });
    });
  });
});
