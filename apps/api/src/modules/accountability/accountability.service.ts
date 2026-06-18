import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportResponseDto } from './dto/report-response.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class AccountabilityService {
  private readonly logger = new Logger(AccountabilityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReportDto): Promise<ReportResponseDto> {
    const convenio = await this.prisma.convenio.findUnique({
      where: { id: dto.convenioId, deletedAt: null },
    });

    if (!convenio) {
      throw new NotFoundException(`Convenio with ID '${dto.convenioId}' not found`);
    }

    const report = await this.prisma.accountabilityReport.create({
      data: {
        convenioId: dto.convenioId,
        notes: dto.notes,
        status: 'DRAFT',
      },
      include: { convenio: { select: { number: true } } },
    });

    this.logger.log(`Accountability report created: ${report.id} (Convenio: ${dto.convenioId})`);
    return ReportResponseDto.fromPrisma(report);
  }

  async findAll(
    query: PaginationDto & { status?: string; convenioId?: string },
  ): Promise<PaginatedResult<ReportResponseDto>> {
    const { page = 1, limit = 20, search, status, convenioId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status ? { status } : {}),
      ...(convenioId ? { convenioId } : {}),
      ...(search
        ? {
            OR: [
              { notes: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.accountabilityReport.findMany({
        where,
        include: { convenio: { select: { number: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.accountabilityReport.count({ where }),
    ]);

    return {
      items: items.map((i) => ReportResponseDto.fromPrisma(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ReportResponseDto> {
    const report = await this.prisma.accountabilityReport.findUnique({
      where: { id },
      include: {
        convenio: { select: { number: true } },
        items: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    return ReportResponseDto.fromPrisma(report);
  }

  async update(id: string, dto: UpdateReportDto): Promise<ReportResponseDto> {
    const report = await this.prisma.accountabilityReport.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    if (report.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT reports can be updated');
    }

    const updated = await this.prisma.accountabilityReport.update({
      where: { id },
      data: {
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { convenio: { select: { number: true } } },
    });

    this.logger.log(`Accountability report updated: ${id}`);
    return ReportResponseDto.fromPrisma(updated);
  }

  async submit(id: string): Promise<ReportResponseDto> {
    const report = await this.prisma.accountabilityReport.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    if (report.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT reports can be submitted');
    }

    const updated = await this.prisma.accountabilityReport.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: { convenio: { select: { number: true } } },
    });

    this.logger.log(`Accountability report submitted: ${id}`);
    return ReportResponseDto.fromPrisma(updated);
  }

  async approve(id: string): Promise<ReportResponseDto> {
    const report = await this.prisma.accountabilityReport.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    if (report.status !== 'SUBMITTED') {
      throw new ConflictException('Only SUBMITTED reports can be approved');
    }

    const updated = await this.prisma.accountabilityReport.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      include: { convenio: { select: { number: true } } },
    });

    this.logger.log(`Accountability report approved: ${id}`);
    return ReportResponseDto.fromPrisma(updated);
  }

  async reject(id: string): Promise<ReportResponseDto> {
    const report = await this.prisma.accountabilityReport.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    if (report.status !== 'SUBMITTED') {
      throw new ConflictException('Only SUBMITTED reports can be rejected');
    }

    const updated = await this.prisma.accountabilityReport.update({
      where: { id },
      data: {
        status: 'DRAFT',
        submittedAt: null,
      },
      include: { convenio: { select: { number: true } } },
    });

    this.logger.log(`Accountability report rejected (returned to DRAFT): ${id}`);
    return ReportResponseDto.fromPrisma(updated);
  }

  async getItems(reportId: string): Promise<ItemResponseDto[]> {
    const report = await this.prisma.accountabilityReport.findUnique({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    const items = await this.prisma.accountabilityItem.findMany({
      where: { reportId },
      orderBy: { id: 'asc' },
    });

    return items.map((i) => ItemResponseDto.fromPrisma(i));
  }

  async addItem(reportId: string, dto: CreateItemDto): Promise<ItemResponseDto> {
    const report = await this.prisma.accountabilityReport.findUnique({ where: { id: reportId } });

    if (!report) {
      throw new NotFoundException('Accountability report not found');
    }

    if (report.status !== 'DRAFT') {
      throw new ConflictException('Only DRAFT reports can receive items');
    }

    const item = await this.prisma.accountabilityItem.create({
      data: {
        reportId,
        description: dto.description,
        amount: dto.amount,
      },
    });

    this.logger.log(`Item added to report ${reportId}: ${item.id}`);
    return ItemResponseDto.fromPrisma(item);
  }
}
