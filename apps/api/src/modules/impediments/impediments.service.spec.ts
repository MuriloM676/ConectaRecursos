import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ImpedimentsService } from './impediments.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ImpedimentStatus } from './dto/create-impediment.dto';

describe('ImpedimentsService', () => {
  let service: ImpedimentsService;
  let prisma: PrismaService;

  const mockImpediment = {
    id: 'imp-1',
    emendaId: 'emenda-1',
    externalId: null,
    description: 'Documentação pendente do convenente',
    status: ImpedimentStatus.OPEN,
    openedAt: new Date(),
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    emenda: { number: '20260001' },
  };

  const mockPrisma = {
    impediment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    impedimentHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    emenda: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpedimentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ImpedimentsService>(ImpedimentsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = { emendaId: 'emenda-1', description: 'Documentação pendente do convenente' };

    it('should create an impediment successfully (IMP-001)', async () => {
      mockPrisma.emenda.findUnique.mockResolvedValue({ id: 'emenda-1' });
      mockPrisma.impediment.create.mockResolvedValue(mockImpediment);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toEqual(mockImpediment.id);
      expect(result.status).toEqual(ImpedimentStatus.OPEN);
      expect(result.emendaNumber).toEqual('20260001');
    });

    it('should throw NotFoundException when emenda does not exist', async () => {
      mockPrisma.emenda.findUnique.mockResolvedValue(null);
      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.impediment.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when externalId already exists', async () => {
      mockPrisma.emenda.findUnique.mockResolvedValue({ id: 'emenda-1' });
      mockPrisma.impediment.findUnique.mockResolvedValue(mockImpediment);

      await expect(service.create({ ...createDto, externalId: 'IMP-001' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated impediments', async () => {
      mockPrisma.impediment.findMany.mockResolvedValue([mockImpediment]);
      mockPrisma.impediment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toEqual(1);
    });

    it('should filter by status', async () => {
      await service.findAll({ status: ImpedimentStatus.OPEN });
      expect(mockPrisma.impediment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: ImpedimentStatus.OPEN }) }),
      );
    });

    it('should filter by emendaId', async () => {
      await service.findAll({ emendaId: 'emenda-1' });
      expect(mockPrisma.impediment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ emendaId: 'emenda-1' }) }),
      );
    });
  });

  describe('findById', () => {
    it('should return an impediment by id', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(mockImpediment);
      const result = await service.findById('imp-1');
      expect(result.id).toEqual('imp-1');
      expect(result.emendaNumber).toEqual('20260001');
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(null);
      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update status and record history', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValueOnce(mockImpediment);
      mockPrisma.impediment.update.mockResolvedValue({ ...mockImpediment, status: ImpedimentStatus.RESOLVED, resolvedAt: new Date() });

      const result = await service.update('imp-1', { status: ImpedimentStatus.RESOLVED });

      expect(result.status).toEqual(ImpedimentStatus.RESOLVED);
      expect(mockPrisma.impedimentHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ impedimentId: 'imp-1', oldStatus: ImpedimentStatus.OPEN, newStatus: ImpedimentStatus.RESOLVED }) }),
      );
    });

    it('should set resolvedAt when status becomes RESOLVED', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValueOnce(mockImpediment);
      mockPrisma.impediment.update.mockResolvedValue({ ...mockImpediment, status: ImpedimentStatus.RESOLVED, resolvedAt: new Date() });

      await service.update('imp-1', { status: ImpedimentStatus.RESOLVED });
      expect(mockPrisma.impediment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ resolvedAt: expect.any(Date) }) }),
      );
    });

    it('should not record history when status does not change', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValueOnce(mockImpediment);
      mockPrisma.impediment.update.mockResolvedValue(mockImpediment);

      await service.update('imp-1', { description: 'Updated' });
      expect(mockPrisma.impedimentHistory.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(null);
      await expect(service.update('non-existent', { status: ImpedimentStatus.RESOLVED })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a manual impediment', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(mockImpediment);
      await service.remove('imp-1');
      expect(mockPrisma.impediment.delete).toHaveBeenCalledWith({ where: { id: 'imp-1' } });
    });

    it('should throw ConflictException for SIOP-synced impediments', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue({ ...mockImpediment, externalId: 'SIOP-IMP-001' });
      await expect(service.remove('imp-1')).rejects.toThrow(ConflictException);
      expect(mockPrisma.impediment.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('should return status history for an impediment', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(mockImpediment);
      mockPrisma.impedimentHistory.findMany.mockResolvedValue([
        { id: 'hist-1', impedimentId: 'imp-1', oldStatus: ImpedimentStatus.OPEN, newStatus: ImpedimentStatus.IN_PROGRESS, changedAt: new Date() },
      ]);

      const result = await service.getHistory('imp-1');
      expect(result).toHaveLength(1);
      expect(result[0].oldStatus).toEqual(ImpedimentStatus.OPEN);
      expect(result[0].newStatus).toEqual(ImpedimentStatus.IN_PROGRESS);
    });

    it('should throw NotFoundException when impediment not found', async () => {
      mockPrisma.impediment.findUnique.mockResolvedValue(null);
      await expect(service.getHistory('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
