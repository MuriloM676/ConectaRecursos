import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ReportResponseDto } from './dto/report-response.dto';
import { GenerateReportDto } from './dto/generate-report.dto';
import { PaginatedResult } from '@common/dto/pagination.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly outputDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.outputDir = path.resolve(process.env.REPORT_DIR || './reports');
  }

  async generate(dto: GenerateReportDto, userId?: string): Promise<ReportResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    await fs.mkdir(this.outputDir, { recursive: true });

    const data = await this.fetchReportData(dto.type);
    const format = dto.format;
    const fileName = `${dto.type}_${Date.now()}.${format.toLowerCase()}`;
    const filePath = path.join(this.outputDir, fileName);

    switch (format) {
      case 'PDF':
        await this.generatePdf(data, filePath, dto.type);
        break;
      case 'XLSX':
        await this.generateXlsx(data, filePath, dto.type);
        break;
      case 'CSV':
        await this.generateCsv(data, filePath, dto.type);
        break;
    }

    const report = await this.prisma.generatedReport.create({
      data: {
        tenantId,
        reportType: dto.type,
        format,
        filePath,
        generatedBy: userId || null,
      },
    });

    this.logger.log(`Report generated: ${report.id} (${dto.type}, ${format})`);
    return ReportResponseDto.fromPrisma(report);
  }

  async findAll(query: { page?: number; limit?: number; type?: string }): Promise<PaginatedResult<ReportResponseDto>> {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...this.prisma.applyTenantFilter('generatedreport', {}),
      ...(type ? { reportType: type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.generatedReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.generatedReport.count({ where }),
    ]);

    return {
      items: items.map((i) => ReportResponseDto.fromPrisma(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async download(id: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const report = await this.prisma.generatedReport.findUnique({ where: { id } });
    if (!report || !report.filePath) {
      throw new NotFoundException('Report not found');
    }

    const filePath = path.resolve(report.filePath);
    const buffer = await fs.readFile(filePath);

    const mimeTypes: Record<string, string> = {
      PDF: 'application/pdf',
      XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      CSV: 'text/csv',
    };

    const ext = report.format.toLowerCase();
    const fileName = `report_${report.reportType.toLowerCase()}.${ext}`;

    return { buffer, fileName, mimeType: mimeTypes[report.format] || 'application/octet-stream' };
  }

  private async fetchReportData(type: string): Promise<any[]> {
    const tenantId = this.prisma.getTenantId();
    const where = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };
    const whereNoDelete = tenantId ? { tenantId } : {};

    switch (type) {
      case 'EMENDAS':
        return this.prisma.emenda.findMany({
          where,
          include: { parliamentarian: true },
          orderBy: { createdAt: 'desc' },
        });

      case 'CONVENIOS':
        return this.prisma.convenio.findMany({
          where: { ...where },
          include: { emenda: { select: { number: true } } },
          orderBy: { createdAt: 'desc' },
        });

      case 'IMPEDIMENTOS':
        return this.prisma.impediment.findMany({
          where: tenantId ? { emenda: { tenantId } } : {},
          include: { emenda: { select: { number: true } } },
          orderBy: { createdAt: 'desc' },
        });

      case 'FINANCEIRO':
        return this.prisma.convenioFinancialSchedule.findMany({
          where: { convenio: where },
          include: { convenio: { select: { number: true } } },
          orderBy: { expectedDate: 'asc' },
        });

      case 'EXECUCAO_FISICA':
        return this.prisma.projectStage.findMany({
          where: { convenio: where },
          include: { convenio: { select: { number: true } } },
          orderBy: { convenioId: 'asc' },
        });

      default:
        return [];
    }
  }

  private async generatePdf(data: any[], filePath: string, _type: string): Promise<void> {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const writeStream = require('fs').createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      doc.pipe(writeStream);

      doc.fontSize(18).font('Helvetica-Bold').text('CaptaGov', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`Relatório: ${_type}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).fillColor('#666').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
      doc.moveDown(2);

      const headers = data.length > 0 ? Object.keys(data[0]).filter((k) => !k.includes('tenant') && k !== 'deletedAt') : [];
      const pageWidth = doc.page.width - 60;
      const colWidth = pageWidth / Math.min(headers.length || 1, 5);

      doc.fontSize(8).font('Helvetica-Bold');
      let y = doc.y;
      headers.slice(0, 5).forEach((h, i) => {
        doc.text(h, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
      });
      doc.moveDown(0.5);

      doc.fontSize(7).font('Helvetica');
      for (const row of data.slice(0, 50)) {
        y = doc.y;
        if (y > doc.page.height - 50) {
          doc.addPage();
          y = doc.y;
        }
        headers.slice(0, 5).forEach((h, i) => {
          const val = typeof row[h] === 'object' ? JSON.stringify(row[h]).slice(0, 30) : String(row[h] ?? '');
          doc.text(val, 30 + i * colWidth, y, { width: colWidth, align: 'left' });
        });
        doc.moveDown(0.3);
      }

      doc.end();
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  private async generateXlsx(data: any[], filePath: string, _type: string): Promise<void> {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(_type);

    const headers = data.length > 0
      ? Object.keys(data[0]).filter((k) => !k.includes('tenant') && k !== 'deletedAt')
      : ['No data'];

    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };

    for (const row of data) {
      const values = headers.map((h) => {
        const val = row[h];
        if (val instanceof Date) return val;
        if (typeof val === 'object' && val !== null) return JSON.stringify(val).slice(0, 50);
        return val ?? '';
      });
      sheet.addRow(values);
    }

    sheet.columns.forEach((col: any) => {
      if (col.eachCell) {
        col.eachCell((cell: any) => {
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
      }
    });

    await workbook.xlsx.writeFile(filePath);
  }

  private async generateCsv(data: any[], filePath: string, _type: string): Promise<void> {
    const headers = data.length > 0
      ? Object.keys(data[0]).filter((k) => !k.includes('tenant') && k !== 'deletedAt')
      : ['No data'];

    const rows = data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(','),
    );

    const csv = [headers.join(','), ...rows].join('\n');
    await fs.writeFile(filePath, csv, 'utf-8');
  }
}
