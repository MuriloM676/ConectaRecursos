import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmendasService } from './emendas.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { EmendaType } from './dto/create-emenda.dto';

describe('EmendasService', () => {
  let service: EmendasService;
  let prisma: PrismaService;

  const mockEmenda = {
    id: 'e-1',
    tenantId: 'tenant-1',
    parliamentarianId: 'p-1',
    year: 2026,
    number: '20260001',
    type: EmendaType.INDIVIDUAL,
    object: 'Construção de UBS',
    amount: 1000000,
    status: 'PENDING',
    source: 'MANUAL',
    createdAt: new Date(),
    parliamentarian: { name: 'João Silva' },
  };

  const mockPrisma = {
    emenda: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    emendaHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    getTenantId: jest.fn().mockReturnValue('tenant-1'),
    applyTenantFilter: jest.fn((model, where) => ({ ...where, tenantId: 'tenant-1' })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmendasService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<EmendasService>(EmendasService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an emenda successfully', async () => {
      mockPrisma.emenda.create.mockResolvedValue(mockEmenda);

      const result = await service.create({
        parliamentarianId: 'p-1',
        year: 2026,
        number: '20260001',
        object: 'Construção de UBS',
        amount: 1000000,
      });

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockEmenda.id);
      expect(mockPrisma.emenda.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated emendas', async () => {
      mockPrisma.emenda.findMany.mockResolvedValue([mockEmenda]);
      mockPrisma.emenda.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toEqual(1);
    });
  });

  describe('findById', () => {
    it('should return an emenda by id', async () => {
      mockPrisma.emenda.findFirst.mockResolvedValue(mockEmenda);

      const result = await service.findById('e-1');

      expect(result).toBeDefined();
      expect(result.id).toEqual('e-1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.emenda.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an emenda and record history on status change', async () => {
      mockPrisma.emenda.findFirst.mockResolvedValue(mockEmenda);
      mockPrisma.emenda.update.mockResolvedValue({ ...mockEmenda, status: 'APPROVED' });

      const result = await service.update('e-1', { status: 'APPROVED' });

      expect(result.status).toEqual('APPROVED');
      expect(mockPrisma.emendaHistory.create).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete an emenda successfully', async () => {
      mockPrisma.emenda.findFirst.mockResolvedValue(mockEmenda);
      mockPrisma.emenda.update.mockResolvedValue({ ...mockEmenda, deletedAt: new Date() });

      await service.remove('e-1');

      expect(mockPrisma.emenda.update).toHaveBeenCalledWith({
        where: { id: 'e-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
    });
  });
});
