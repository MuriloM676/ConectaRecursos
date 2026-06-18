import { Test, TestingModule } from '@nestjs/testing';
import { AccountabilityService } from '../accountability.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('AccountabilityService', () => {
  let service: AccountabilityService;
  let prisma: any;

  const mockReport = {
    id: 'report-1',
    convenioId: 'conv-1',
    status: 'DRAFT',
    submittedAt: null,
    approvedAt: null,
    notes: 'Test notes',
    createdAt: new Date(),
    updatedAt: new Date(),
    convenio: { number: 'CV-001' },
    items: [],
  };

  const mockItem = {
    id: 'item-1',
    reportId: 'report-1',
    description: 'Material',
    amount: 50000,
  };

  beforeEach(async () => {
    prisma = {
      convenio: {
        findUnique: jest.fn(),
      },
      accountabilityReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      accountabilityItem: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      getTenantId: jest.fn().mockReturnValue('tenant-1'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountabilityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AccountabilityService>(AccountabilityService);
  });

  describe('create', () => {
    it('should create a report', async () => {
      prisma.convenio.findUnique.mockResolvedValue({ id: 'conv-1' });
      prisma.accountabilityReport.create.mockResolvedValue(mockReport);

      const result = await service.create({ convenioId: 'conv-1', notes: 'Test notes' });
      expect(result.id).toBe('report-1');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw if convenio not found', async () => {
      prisma.convenio.findUnique.mockResolvedValue(null);

      await expect(service.create({ convenioId: 'invalid' })).rejects.toThrow('Convenio with ID \'invalid\' not found');
    });
  });

  describe('findAll', () => {
    it('should return paginated reports', async () => {
      prisma.accountabilityReport.findMany.mockResolvedValue([mockReport]);
      prisma.accountabilityReport.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a report by id', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);

      const result = await service.findById('report-1');
      expect(result.id).toBe('report-1');
    });

    it('should throw if not found', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow('Accountability report not found');
    });
  });

  describe('update', () => {
    it('should update a DRAFT report', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);
      prisma.accountabilityReport.update.mockResolvedValue({ ...mockReport, notes: 'Updated' });

      const result = await service.update('report-1', { notes: 'Updated' });
      expect(result.notes).toBe('Updated');
    });

    it('should throw if report is not DRAFT', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'SUBMITTED' });

      await expect(service.update('report-1', { notes: 'test' })).rejects.toThrow('Only DRAFT reports can be updated');
    });
  });

  describe('submit', () => {
    it('should submit a DRAFT report', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);
      prisma.accountabilityReport.update.mockResolvedValue({ ...mockReport, status: 'SUBMITTED', submittedAt: new Date() });

      const result = await service.submit('report-1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('should throw if not DRAFT', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'APPROVED' });

      await expect(service.submit('report-1')).rejects.toThrow('Only DRAFT reports can be submitted');
    });
  });

  describe('approve', () => {
    it('should approve a SUBMITTED report', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'SUBMITTED', submittedAt: new Date() });
      prisma.accountabilityReport.update.mockResolvedValue({ ...mockReport, status: 'APPROVED', approvedAt: new Date() });

      const result = await service.approve('report-1');
      expect(result.status).toBe('APPROVED');
    });

    it('should throw if not SUBMITTED', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);

      await expect(service.approve('report-1')).rejects.toThrow('Only SUBMITTED reports can be approved');
    });
  });

  describe('reject', () => {
    it('should reject a SUBMITTED report back to DRAFT', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'SUBMITTED', submittedAt: new Date() });
      prisma.accountabilityReport.update.mockResolvedValue(mockReport);

      const result = await service.reject('report-1');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw if not SUBMITTED', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);

      await expect(service.reject('report-1')).rejects.toThrow('Only SUBMITTED reports can be rejected');
    });
  });

  describe('getItems', () => {
    it('should return items for a report', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);
      prisma.accountabilityItem.findMany.mockResolvedValue([mockItem]);

      const result = await service.getItems('report-1');
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Material');
    });
  });

  describe('addItem', () => {
    it('should add item to DRAFT report', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue(mockReport);
      prisma.accountabilityItem.create.mockResolvedValue(mockItem);

      const result = await service.addItem('report-1', { description: 'Material', amount: 50000 });
      expect(result.description).toBe('Material');
    });

    it('should throw if report not DRAFT', async () => {
      prisma.accountabilityReport.findUnique.mockResolvedValue({ ...mockReport, status: 'SUBMITTED' });

      await expect(service.addItem('report-1', { description: 'test', amount: 100 })).rejects.toThrow('Only DRAFT reports can receive items');
    });
  });
});
