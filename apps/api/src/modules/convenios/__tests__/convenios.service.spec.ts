import { Test, TestingModule } from '@nestjs/testing';
import { ConveniosService } from '../convenios.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('ConveniosService', () => {
  let service: ConveniosService;
  let prisma: PrismaService;

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

  const mockPrisma = {
    emenda: {
      findUnique: jest.fn(),
    },
    convenio: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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
    prisma = module.get<PrismaService>(PrismaService);
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
});
