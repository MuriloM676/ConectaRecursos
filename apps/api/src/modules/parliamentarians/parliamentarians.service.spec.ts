import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ParliamentariansService } from './parliamentarians.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('ParliamentariansService', () => {
  let service: ParliamentariansService;
  let prisma: PrismaService;

  const mockParliamentarian = {
    id: 'p-1',
    name: 'João Silva',
    party: 'PT',
    state: 'SP',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    parliamentarian: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emenda: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParliamentariansService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ParliamentariansService>(ParliamentariansService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a parliamentarian successfully', async () => {
      mockPrisma.parliamentarian.create.mockResolvedValue(mockParliamentarian);

      const result = await service.create({
        name: 'João Silva',
        party: 'PT',
        state: 'SP',
      });

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockParliamentarian.id);
      expect(mockPrisma.parliamentarian.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all parliamentarians', async () => {
      mockPrisma.parliamentarian.findMany.mockResolvedValue([mockParliamentarian]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toEqual(mockParliamentarian.id);
    });
  });

  describe('findById', () => {
    it('should return a parliamentarian by id', async () => {
      mockPrisma.parliamentarian.findUnique.mockResolvedValue(mockParliamentarian);

      const result = await service.findById('p-1');

      expect(result).toBeDefined();
      expect(result.id).toEqual('p-1');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.parliamentarian.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a parliamentarian successfully', async () => {
      mockPrisma.parliamentarian.findUnique.mockResolvedValue(mockParliamentarian);
      mockPrisma.parliamentarian.update.mockResolvedValue({ ...mockParliamentarian, name: 'João Updated' });

      const result = await service.update('p-1', { name: 'João Updated' });

      expect(result).toBeDefined();
      expect(result.name).toEqual('João Updated');
    });
  });

  describe('remove', () => {
    it('should delete a parliamentarian successfully', async () => {
      mockPrisma.parliamentarian.findUnique.mockResolvedValue(mockParliamentarian);
      mockPrisma.emenda.count.mockResolvedValue(0);

      await service.remove('p-1');

      expect(mockPrisma.parliamentarian.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });

    it('should throw error if has emendas assigned', async () => {
      mockPrisma.parliamentarian.findUnique.mockResolvedValue(mockParliamentarian);
      mockPrisma.emenda.count.mockResolvedValue(1);

      await expect(service.remove('p-1')).rejects.toThrow('Cannot delete parliamentarian with 1 emendas assigned');
    });
  });
});
