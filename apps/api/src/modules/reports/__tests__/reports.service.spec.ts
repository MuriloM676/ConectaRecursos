import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn().mockReturnValue({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: Function) {
      if (event === 'finish') cb();
      return this;
    }),
    end: jest.fn(),
  }),
}));

jest.mock('pdfkit', () => {
  const MockPDFDocument = jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: Function) {
      if (event === 'finish') setTimeout(cb, 0);
      return this;
    }),
    end: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    addPage: jest.fn(),
    page: { width: 595, height: 842 },
    y: 100,
  }));
  return MockPDFDocument;
});

jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    addWorksheet: jest.fn().mockReturnValue({
      addRow: jest.fn(),
      getRow: jest.fn().mockReturnValue({ font: {} }),
      columns: [],
    }),
    xlsx: {
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
  })),
}));

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: any;

  const mockReport = {
    id: 'report-1',
    tenantId: 'tenant-1',
    reportType: 'EMENDAS',
    format: 'PDF',
    generatedBy: 'user-1',
    filePath: '/tmp/test-report.pdf',
    generatedAt: new Date(),
  };

  beforeEach(async () => {
    // Reset the REPORT_DIR env to use a temp dir
    process.env.REPORT_DIR = '/tmp';

    prisma = {
      generatedReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      emenda: {
        findMany: jest.fn(),
      },
      convenio: {
        findMany: jest.fn(),
      },
      impediment: {
        findMany: jest.fn(),
      },
      convenioFinancialSchedule: {
        findMany: jest.fn(),
      },
      projectStage: {
        findMany: jest.fn(),
      },
      getTenantId: jest.fn().mockReturnValue('tenant-1'),
      applyTenantFilter: jest.fn((_model, where) => where || {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('generate', () => {
    it('should generate a PDF report', async () => {
      prisma.emenda.findMany.mockResolvedValue([{ id: '1', number: '2026001', amount: 500000, parliamentarian: { name: 'Dep A' } }]);
      prisma.generatedReport.create.mockResolvedValue(mockReport);

      const result = await service.generate({ type: 'EMENDAS', format: 'PDF' }, 'user-1');
      expect(result.id).toBe('report-1');
      expect(result.format).toBe('PDF');
    });

    it('should generate an XLSX report', async () => {
      prisma.emenda.findMany.mockResolvedValue([{ id: '1', number: '2026001', amount: 500000, parliamentarian: { name: 'Dep A' } }]);
      prisma.generatedReport.create.mockResolvedValue({ ...mockReport, format: 'XLSX' });

      const result = await service.generate({ type: 'EMENDAS', format: 'XLSX' }, 'user-1');
      expect(result.format).toBe('XLSX');
    });

    it('should generate a CSV report', async () => {
      prisma.emenda.findMany.mockResolvedValue([{ id: '1', number: '2026001', amount: 500000, parliamentarian: { name: 'Dep A' } }]);
      prisma.generatedReport.create.mockResolvedValue({ ...mockReport, format: 'CSV' });

      const result = await service.generate({ type: 'EMENDAS', format: 'CSV' }, 'user-1');
      expect(result.format).toBe('CSV');
    });

    it('should throw if tenant context is missing', async () => {
      prisma.getTenantId.mockReturnValue(null);

      await expect(
        service.generate({ type: 'EMENDAS', format: 'PDF' }, 'user-1'),
      ).rejects.toThrow('Tenant context missing');
    });
  });

  describe('findAll', () => {
    it('should return paginated reports', async () => {
      prisma.generatedReport.findMany.mockResolvedValue([mockReport]);
      prisma.generatedReport.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('download', () => {
    it('should download a report file', async () => {
      prisma.generatedReport.findUnique.mockResolvedValue(mockReport);
      jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('test-content'));

      const result = await service.download('report-1');
      expect(result.fileName).toContain('emendas');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should throw if not found', async () => {
      prisma.generatedReport.findUnique.mockResolvedValue(null);

      await expect(service.download('invalid')).rejects.toThrow('Report not found');
    });
  });
});
