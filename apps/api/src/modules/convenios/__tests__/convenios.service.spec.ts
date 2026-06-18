import { Test, TestingModule } from '@nestjs/testing';
import { ConveniosService } from '../convenios.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ConveniosService', () => {
  let service: ConveniosService;

  const mockConvenio = {
    id: 'convenio-1',
    tenantId: 'tenant-1',
    emendaId: 'emenda-1',
    number: 'CV-2026-001',
    object: 'Construção de UBS',
    totalAmount: 2500000,
    counterpartAmount: 200000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2027-01-01'),
    status: 'DRAFT',
    createdAt: new Date(),
    deletedAt: null,
    updatedAt: new Date(),
    emenda: { number: '20260001' },
    financialSchedules: [],
    projectStages: [],
    accountabilityReports: [],
  };

  const mockScheduleItem = {
    id: 'schedule-1',
    convenioId: 'convenio-1',
    expectedAmount: 500000,
    expectedDate: new Date('2026-09-01'),
    receivedAmount: null,
    receivedDate: null,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    emenda: {
      findUnique: jest.fn(),
    },
    convenio: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    convenioFinancialSchedule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    applyTenantFilter: jest.fn((model, where) => ({ ...where, tenantId: 'tenant-1' })),
    getTenantId: jest.fn().mockReturnValue('tenant-1'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConveniosService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ConveniosService>(ConveniosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a convenio successfully', async () => {
      mockPrisma.emenda.findUnique.mockResolvedValue({ id: 'emenda-1' } as any);
      mockPrisma.convenio.create.mockResolvedValue(mockConvenio as any);

      const result = await service.create({
        emendaId: 'emenda-1',
        number: 'CV-2026-001',
        object: 'Construção de UBS',
        totalAmount: 2500000,
        counterpartAmount: 200000,
        status: 'DRAFT',
      });

      expect(result).toBeDefined();
      expect(result.number).toBe('CV-2026-001');
    });

    it('should throw NotFoundException when emenda does not exist', async () => {
      mockPrisma.emenda.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          emendaId: 'emenda-1',
          number: 'CV-2026-001',
          object: 'Construção de UBS',
          totalAmount: 2500000,
          counterpartAmount: 200000,
          status: 'DRAFT',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return convenio by id', async () => {
      mockPrisma.convenio.findFirst.mockResolvedValue(mockConvenio as any);

      const result = await service.findById('convenio-1');

      expect(result).toBeDefined();
      expect(result.status).toBe('DRAFT');
    });
  });

  describe('getFinancialSchedules', () => {
    it('should return schedule items for a valid convenio', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue(mockConvenio as any);
      mockPrisma.convenioFinancialSchedule.findMany.mockResolvedValue([mockScheduleItem] as any);

      const result = await service.getFinancialSchedules('convenio-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('schedule-1');
    });

    it('should throw NotFoundException for invalid convenio', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue(null);

      await expect(service.getFinancialSchedules('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFinancialSchedule', () => {
    it('should update a schedule item', async () => {
      mockPrisma.convenioFinancialSchedule.findUnique.mockResolvedValue(mockScheduleItem as any);
      mockPrisma.convenioFinancialSchedule.update.mockResolvedValue({
        ...mockScheduleItem,
        receivedAmount: 500000,
        receivedDate: new Date('2026-09-15'),
        status: 'RECEIVED',
      } as any);

      const result = await service.updateFinancialSchedule('schedule-1', {
        receivedAmount: 500000,
        receivedDate: '2026-09-15',
        status: 'RECEIVED',
      });

      expect(result.status).toBe('RECEIVED');
      expect(Number(result.receivedAmount)).toBe(500000);
    });

    it('should throw NotFoundException for invalid schedule', async () => {
      mockPrisma.convenioFinancialSchedule.findUnique.mockResolvedValue(null);

      await expect(service.updateFinancialSchedule('invalid-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBalance', () => {
    it('should calculate balance correctly', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue(mockConvenio as any);
      mockPrisma.convenioFinancialSchedule.findMany.mockResolvedValue([
        { ...mockScheduleItem, expectedAmount: 500000, receivedAmount: null },
        { ...mockScheduleItem, id: 'schedule-2', expectedAmount: 300000, receivedAmount: 300000 },
      ] as any);

      const result = await service.getBalance('convenio-1');

      expect(result.totalExpected).toBe(800000);
      expect(result.totalReceived).toBe(300000);
      expect(result.balance).toBe(-500000);
      expect(result.scheduleCount).toBe(2);
    });

    it('should throw NotFoundException for invalid convenio', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue(null);

      await expect(service.getBalance('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getIndicators', () => {
    it('should return aggregated indicators', async () => {
      mockPrisma.convenio.findMany.mockResolvedValue([
        { status: 'DRAFT' },
        { status: 'ACTIVE' },
        { status: 'ACTIVE' },
        { status: 'COMPLETED' },
      ] as any);
      mockPrisma.convenio.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 5000000 } } as any)
        .mockResolvedValueOnce({ _sum: { counterpartAmount: 500000 } } as any);

      const result = await service.getIndicators();

      expect(result.total).toBe(4);
      expect(result.byStatus).toEqual({ DRAFT: 1, ACTIVE: 2, COMPLETED: 1 });
      expect(result.totalAmount).toBe(5000000);
      expect(result.totalCounterpart).toBe(500000);
    });
  });
});
