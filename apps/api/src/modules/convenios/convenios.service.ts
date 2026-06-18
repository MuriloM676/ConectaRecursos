import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateConvenioDto } from './dto/create-convenio.dto';
import { UpdateConvenioDto } from './dto/update-convenio.dto';
import { ConvenioResponseDto } from './dto/convenio-response.dto';
import { CreateFinancialScheduleDto } from './dto/financial-schedule.dto';
import { UpdateFinancialScheduleDto } from './dto/update-financial-schedule.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class ConveniosService {
  private readonly logger = new Logger(ConveniosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConvenioDto): Promise<ConvenioResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    const emenda = await this.prisma.emenda.findUnique({
      where: { id: dto.emendaId },
    });

    if (!emenda) {
      throw new NotFoundException(`Emenda with ID '${dto.emendaId}' not found`);
    }

    const convenio = await this.prisma.convenio.create({
      data: {
        tenantId,
        emendaId: dto.emendaId,
        number: dto.number,
        object: dto.object,
        totalAmount: dto.totalAmount,
        counterpartAmount: dto.counterpartAmount,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status || 'DRAFT',
      },
      include: { emenda: { select: { number: true } } },
    });

    this.logger.log(`Convenio created: ${convenio.number} (Tenant: ${tenantId})`);
    return ConvenioResponseDto.fromPrisma(convenio);
  }

  async findAll(query: PaginationDto & { status?: string; emendaId?: string }): Promise<PaginatedResult<ConvenioResponseDto>> {
    const { page = 1, limit = 20, search, status, emendaId } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...this.prisma.applyTenantFilter('convenio', {}),
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(emendaId ? { emendaId } : {}),
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' as const } },
              { object: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.convenio.findMany({
        where,
        include: { emenda: { select: { number: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.convenio.count({ where }),
    ]);

    return {
      items: items.map((i) => ConvenioResponseDto.fromPrisma(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<ConvenioResponseDto> {
    const where = {
      ...this.prisma.applyTenantFilter('convenio', { id, deletedAt: null }),
    };

    const convenio = await this.prisma.convenio.findFirst({
      where,
      include: { emenda: { select: { number: true } } },
    });

    if (!convenio) {
      throw new Error('Convenio not found');
    }

    return ConvenioResponseDto.fromPrisma(convenio);
  }

  async update(id: string, dto: UpdateConvenioDto): Promise<ConvenioResponseDto> {
    const existing = await this.findById(id);

    const updated = await this.prisma.convenio.update({
      where: { id },
      data: {
        ...(dto.number !== undefined && { number: dto.number }),
        ...(dto.object !== undefined && { object: dto.object }),
        ...(dto.totalAmount !== undefined && { totalAmount: dto.totalAmount }),
        ...(dto.counterpartAmount !== undefined && { counterpartAmount: dto.counterpartAmount }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: { emenda: { select: { number: true } } },
    });

    this.logger.log(`Convenio updated: ${updated.number}`);
    return ConvenioResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.convenio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Convenio removed (soft delete): ${id}`);
  }

  async addFinancialSchedule(convenioId: string, dto: CreateFinancialScheduleDto): Promise<any> {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId } });
    if (!convenio) {
      throw new NotFoundException('Convenio not found');
    }

    const item = await this.prisma.convenioFinancialSchedule.create({
      data: {
        convenioId,
        expectedAmount: dto.expectedAmount,
        expectedDate: new Date(dto.expectedDate),
        status: dto.status || 'PENDING',
      },
    });

    return item;
  }

  async getFinancialSchedules(convenioId: string): Promise<any[]> {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId, deletedAt: null } });
    if (!convenio) {
      throw new NotFoundException('Convenio not found');
    }

    return this.prisma.convenioFinancialSchedule.findMany({
      where: { convenioId },
      orderBy: { expectedDate: 'asc' },
    });
  }

  async updateFinancialSchedule(scheduleId: string, dto: UpdateFinancialScheduleDto): Promise<any> {
    const existing = await this.prisma.convenioFinancialSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existing) {
      throw new NotFoundException('Financial schedule item not found');
    }

    const data: any = {};

    if (dto.expectedAmount !== undefined) data.expectedAmount = dto.expectedAmount;
    if (dto.expectedDate !== undefined) data.expectedDate = new Date(dto.expectedDate);
    if (dto.receivedAmount !== undefined) data.receivedAmount = dto.receivedAmount;
    if (dto.receivedDate !== undefined) data.receivedDate = new Date(dto.receivedDate);
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.convenioFinancialSchedule.update({
      where: { id: scheduleId },
      data,
    });
  }

  async getBalance(convenioId: string): Promise<{
    totalExpected: number;
    totalReceived: number;
    balance: number;
    scheduleCount: number;
  }> {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId, deletedAt: null } });
    if (!convenio) {
      throw new NotFoundException('Convenio not found');
    }

    const schedules = await this.prisma.convenioFinancialSchedule.findMany({
      where: { convenioId },
    });

    const totalExpected = schedules.reduce((sum, s) => sum + Number(s.expectedAmount), 0);
    const totalReceived = schedules.reduce(
      (sum, s) => sum + (s.receivedAmount ? Number(s.receivedAmount) : 0),
      0,
    );

    return {
      totalExpected,
      totalReceived,
      balance: totalReceived - totalExpected,
      scheduleCount: schedules.length,
    };
  }

  async getIndicators(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalAmount: number;
    totalCounterpart: number;
  }> {
    const tenantId = this.prisma.getTenantId();

    const where = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };

    const [convenios, totalAmountResult, totalCounterpartResult] = await Promise.all([
      this.prisma.convenio.findMany({ where, select: { status: true } }),
      this.prisma.convenio.aggregate({ where, _sum: { totalAmount: true } }),
      this.prisma.convenio.aggregate({ where, _sum: { counterpartAmount: true } }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const c of convenios) {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
    }

    return {
      total: convenios.length,
      byStatus,
      totalAmount: Number(totalAmountResult._sum.totalAmount) || 0,
      totalCounterpart: Number(totalCounterpartResult._sum.counterpartAmount) || 0,
    };
  }
}
