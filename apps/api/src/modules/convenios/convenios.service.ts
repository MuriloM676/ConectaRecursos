import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateConvenioDto } from './dto/create-convenio.dto';
import { UpdateConvenioDto } from './dto/update-convenio.dto';
import { ConvenioResponseDto } from './dto/convenio-response.dto';
import { CreateFinancialScheduleDto } from './dto/financial-schedule.dto';
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
      throw new Error(`Emenda with ID '${dto.emendaId}' not found`);
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
      throw new Error('Convenio not found');
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
}
