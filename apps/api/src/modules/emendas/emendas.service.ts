import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateEmendaDto } from './dto/create-emenda.dto';
import { UpdateEmendaDto } from './dto/update-emenda.dto';
import { EmendaResponseDto } from './dto/emenda-response.dto';
import { EmendaHistoryResponseDto } from './dto/emenda-history-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class EmendasService {
  private readonly logger = new Logger(EmendasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmendaDto): Promise<EmendaResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    const emenda = await this.prisma.emenda.create({
      data: {
        ...dto,
        tenantId,
      },
      include: {
        parliamentarian: true,
      },
    });

    this.logger.log(`Emenda created: ${emenda.number} (Tenant: ${tenantId})`);
    return EmendaResponseDto.fromPrisma(emenda);
  }

  async findAll(pagination: PaginationDto & { year?: number; status?: string; parliamentarianId?: string }): Promise<PaginatedResult<EmendaResponseDto>> {
    const { page = 1, limit = 20, search, year, status, parliamentarianId } = pagination;
    const skip = (page - 1) * limit;

    const where = this.prisma.applyTenantFilter('emenda', {
      deletedAt: null,
      year: year ? Number(year) : undefined,
      status: status || undefined,
      parliamentarianId: parliamentarianId || undefined,
      ...(search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' as const } },
              { object: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    });

    const [items, total] = await Promise.all([
      this.prisma.emenda.findMany({
        where,
        include: { parliamentarian: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emenda.count({ where }),
    ]);

    return {
      items: items.map(e => EmendaResponseDto.fromPrisma(e)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<EmendaResponseDto> {
    const where = this.prisma.applyTenantFilter('emenda', { id, deletedAt: null });
    const emenda = await this.prisma.emenda.findFirst({
      where,
      include: { parliamentarian: true },
    });

    if (!emenda) throw new NotFoundException('Emenda not found');

    return EmendaResponseDto.fromPrisma(emenda);
  }

  async update(id: string, dto: UpdateEmendaDto): Promise<EmendaResponseDto> {
    const where = this.prisma.applyTenantFilter('emenda', { id, deletedAt: null });
    const emenda = await this.prisma.emenda.findFirst({ where });

    if (!emenda) throw new NotFoundException('Emenda not found');

    // Simple history tracking for status changes
    if (dto.status && dto.status !== emenda.status) {
      await this.prisma.emendaHistory.create({
        data: {
          emendaId: id,
          fieldName: 'status',
          oldValue: emenda.status,
          newValue: dto.status,
        },
      });
    }

    const updated = await this.prisma.emenda.update({
      where: { id },
      data: dto,
      include: { parliamentarian: true },
    });

    return EmendaResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    const where = this.prisma.applyTenantFilter('emenda', { id, deletedAt: null });
    const emenda = await this.prisma.emenda.findFirst({ where });

    if (!emenda) throw new NotFoundException('Emenda not found');

    await this.prisma.emenda.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getHistory(id: string): Promise<EmendaHistoryResponseDto[]> {
    const where = this.prisma.applyTenantFilter('emenda', { id, deletedAt: null });
    const emenda = await this.prisma.emenda.findFirst({ where });

    if (!emenda) throw new NotFoundException('Emenda not found');

    const history = await this.prisma.emendaHistory.findMany({
      where: { emendaId: id },
      orderBy: { createdAt: 'desc' },
    });

    return history.map(h => EmendaHistoryResponseDto.fromPrisma(h));
  }
}
