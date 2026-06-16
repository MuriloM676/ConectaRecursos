import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: PrismaService;

  const mockTenant = {
    id: 'tenant-1',
    name: 'Prefeitura de São Paulo',
    document: '12345678000199',
    city: 'São Paulo',
    state: 'SP',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      name: 'Prefeitura de São Paulo',
      document: '12345678000199',
      city: 'São Paulo',
      state: 'SP',
    };

    it('should create a tenant successfully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      mockPrisma.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockTenant.id);
      expect(result.name).toEqual(mockTenant.name);
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });

    it('should throw ConflictException when CNPJ already exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrisma.tenant.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tenants ordered by createdAt desc', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([mockTenant]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(mockTenant.id);
      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a tenant by id', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findById('tenant-1');

      expect(result).toBeDefined();
      expect(result.id).toEqual('tenant-1');
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Prefeitura de São Paulo Updated',
      city: 'São Paulo',
    };

    it('should update a tenant successfully', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        ...updateDto,
      });

      const result = await service.update('tenant-1', updateDto);

      expect(result).toBeDefined();
      expect(result.name).toEqual(updateDto.name);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when CNPJ conflicts', async () => {
      const updateWithCnpj = { document: '99999999000199' };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'other-tenant',
        document: '99999999000199',
      });

      await expect(
        service.update('tenant-1', updateWithCnpj),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should deactivate a tenant (soft delete)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrisma.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: 'INACTIVE',
      });

      await service.remove('tenant-1');

      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'INACTIVE' },
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
