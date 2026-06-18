import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      emenda: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      convenio: {
        count: jest.fn(),
      },
      impediment: {
        count: jest.fn(),
      },
      convenioFinancialSchedule: {
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
      projectStage: {
        aggregate: jest.fn(),
      },
      getTenantId: jest.fn().mockReturnValue('tenant-1'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getOverview', () => {
    it('should return aggregated overview data', async () => {
      prisma.emenda.aggregate.mockResolvedValue({
        _sum: { amount: 1000000 },
        _count: 10,
      });
      prisma.convenio.count.mockResolvedValue(3);
      prisma.impediment.count.mockResolvedValue(2);
      prisma.convenioFinancialSchedule.aggregate.mockResolvedValue({
        _sum: { receivedAmount: 500000 },
      });
      prisma.projectStage.aggregate.mockResolvedValue({
        _avg: { actualPercentage: 40 },
      });

      const result = await service.getOverview();

      expect(result.capturedAmount).toBe(1000000);
      expect(result.receivedAmount).toBe(500000);
      expect(result.executedAmount).toBe(400000);
      expect(result.totalEmendas).toBe(10);
      expect(result.activeConvenios).toBe(3);
      expect(result.openImpediments).toBe(2);
      expect(result.executionPercentage).toBe(40);
      expect(result.receivedPercentage).toBe(50);
    });

    it('should return zeros when no data exists', async () => {
      prisma.emenda.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _count: 0,
      });
      prisma.convenio.count.mockResolvedValue(0);
      prisma.impediment.count.mockResolvedValue(0);
      prisma.convenioFinancialSchedule.aggregate.mockResolvedValue({
        _sum: { receivedAmount: null },
      });
      prisma.projectStage.aggregate.mockResolvedValue({
        _avg: { actualPercentage: null },
      });

      const result = await service.getOverview();

      expect(result.capturedAmount).toBe(0);
      expect(result.receivedAmount).toBe(0);
      expect(result.executedAmount).toBe(0);
      expect(result.totalEmendas).toBe(0);
    });
  });

  describe('getEmendasByStatus', () => {
    it('should group emendas by status', async () => {
      prisma.emenda.findMany.mockResolvedValue([
        { status: 'APPROVED', amount: 500000 },
        { status: 'APPROVED', amount: 300000 },
        { status: 'PENDING', amount: 200000 },
      ]);

      const result = await service.getEmendasByStatus();

      expect(result).toHaveLength(2);
      const approved = result.find((r) => r.status === 'APPROVED');
      expect(approved?.count).toBe(2);
      expect(approved?.totalAmount).toBe(800000);
    });
  });

  describe('getParliamentarians', () => {
    it('should return top parliamentarians by amount', async () => {
      prisma.emenda.findMany.mockResolvedValue([
        { id: '1', amount: 500000, parliamentarian: { id: 'p1', name: 'Dep A', party: 'XYZ', state: 'SP' } },
        { id: '2', amount: 300000, parliamentarian: { id: 'p2', name: 'Dep B', party: 'ABC', state: 'RJ' } },
        { id: '3', amount: 200000, parliamentarian: { id: 'p1', name: 'Dep A', party: 'XYZ', state: 'SP' } },
      ]);

      const result = await service.getParliamentarians(5);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Dep A');
      expect(result[0].totalAmount).toBe(700000);
      expect(result[0].emendaCount).toBe(2);
    });
  });

  describe('getAreas', () => {
    it('should group emendas by type', async () => {
      prisma.emenda.findMany.mockResolvedValue([
        { type: 'INDIVIDUAL', amount: 500000 },
        { type: 'INDIVIDUAL', amount: 300000 },
        { type: 'BANCADA', amount: 1000000 },
      ]);

      const result = await service.getAreas();

      expect(result).toHaveLength(2);
      const individual = result.find((r) => r.type === 'INDIVIDUAL');
      expect(individual?.count).toBe(2);
      expect(individual?.totalAmount).toBe(800000);
    });
  });

  describe('getFinancial', () => {
    it('should return financial summary with monthly breakdown', async () => {
      prisma.convenioFinancialSchedule.findMany.mockResolvedValue([
        { expectedAmount: 500000, expectedDate: new Date('2026-01-15'), receivedAmount: 200000 },
        { expectedAmount: 300000, expectedDate: new Date('2026-01-20'), receivedAmount: 300000 },
        { expectedAmount: 400000, expectedDate: new Date('2026-02-10'), receivedAmount: null },
      ]);

      const result = await service.getFinancial();

      expect(result.totalExpected).toBe(1200000);
      expect(result.totalReceived).toBe(500000);
      expect(result.balance).toBe(-700000);
      expect(result.monthlyBreakdown).toHaveLength(2);
      expect(result.monthlyBreakdown[0].month).toBe(1);
      expect(result.monthlyBreakdown[0].expectedAmount).toBe(800000);
    });

    it('should return zeros when no schedules exist', async () => {
      prisma.convenioFinancialSchedule.findMany.mockResolvedValue([]);

      const result = await service.getFinancial();

      expect(result.totalExpected).toBe(0);
      expect(result.totalReceived).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.monthlyBreakdown).toHaveLength(0);
    });
  });
});
