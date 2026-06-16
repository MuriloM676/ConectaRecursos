import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateImpedimentDto, ImpedimentStatus } from './dto/create-impediment.dto';
import { UpdateImpedimentDto } from './dto/update-impediment.dto';
import { ImpedimentResponseDto } from './dto/impediment-response.dto';
import { ImpedimentHistoryResponseDto } from './dto/impediment-history-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class ImpedimentsService {
  private readonly logger = new Logger(ImpedimentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateImpedimentDto): Promise<ImpedimentResponseDto> {
    // Validate emenda exists
    const emenda = await this.prisma.emenda.findUnique({
      where: { id: dto.emendaId },
    });

    if (!emenda) {
      throw new NotFoundException(`Emenda with ID '${dto.emendaId}' not found`);
    }

    // Check for duplicate externalId if provided
    if (dto.externalId) {
      const existing = await this.prisma.impediment.findUnique({
        where: { externalId: dto.externalId },
      });
      if (existing) {
        throw new ConflictException(
          `Impediment with external ID '${dto.externalId}' already exists`,
        );
      }
    }

    const impediment = await this.prisma.impediment.create({
      data: {
        emendaId: dto.emendaId,
        description: dto.description,
        externalId: dto.externalId,
        status: dto.status || ImpedimentStatus.OPEN,
        openedAt: new Date(),
      },
      include: {
        emenda: { select: { number: true } },
      },
    });

    this.logger.log(
      `Impediment created: ${impediment.id} (Emenda: ${dto.emendaId}, Status: ${impediment.status})`,
    );

    return ImpedimentResponseDto.fromPrisma(impediment);
  }

  async findAll(
    query: PaginationDto & { status?: string; emendaId?: string },
  ): Promise<PaginatedResult<ImpedimentResponseDto>> {
    const { page = 1, limit = 20, search, status, emendaId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status ? { status } : {}),
      ...(emendaId ? { emendaId } : {}),
      ...(search
        ? {
            OR: [
              { description: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.impediment.findMany({
        where,
        include: {
          emenda: { select: { number: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.impediment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((i) => ImpedimentResponseDto.fromPrisma(i)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<ImpedimentResponseDto> {
    const impediment = await this.prisma.impediment.findUnique({
      where: { id },
      include: {
        emenda: { select: { number: true } },
      },
    });

    if (!impediment) {
      throw new NotFoundException('Impediment not found');
    }

    return ImpedimentResponseDto.fromPrisma(impediment);
  }

  async update(
    id: string,
    dto: UpdateImpedimentDto,
  ): Promise<ImpedimentResponseDto> {
    const impediment = await this.prisma.impediment.findUnique({
      where: { id },
    });

    if (!impediment) {
      throw new NotFoundException('Impediment not found');
    }

    // Track status changes in history
    const newStatus = dto.status || impediment.status;
    if (newStatus !== impediment.status) {
      await this.prisma.impedimentHistory.create({
        data: {
          impedimentId: id,
          oldStatus: impediment.status,
          newStatus,
        },
      });
    }

    // Auto-set resolvedAt when status changes to RESOLVED
    const resolvedAt =
      newStatus === ImpedimentStatus.RESOLVED && impediment.status !== ImpedimentStatus.RESOLVED
        ? new Date()
        : dto.status && dto.status !== ImpedimentStatus.RESOLVED
          ? null
          : impediment.resolvedAt;

    const updated = await this.prisma.impediment.update({
      where: { id },
      data: {
        description: dto.description ?? impediment.description,
        status: newStatus,
        resolvedAt,
      },
      include: {
        emenda: { select: { number: true } },
      },
    });

    this.logger.log(
      `Impediment updated: ${id} (Status: ${impediment.status} → ${newStatus})`,
    );

    return ImpedimentResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    const impediment = await this.prisma.impediment.findUnique({
      where: { id },
    });

    if (!impediment) {
      throw new NotFoundException('Impediment not found');
    }

    // Prevent deletion of SIOP-synced impediments (as per spec-004 regra)
    if (impediment.externalId) {
      throw new ConflictException(
        'Cannot delete impediments synchronized from SIOP. Use status CANCELLED instead.',
      );
    }

    await this.prisma.impedimentHistory.deleteMany({
      where: { impedimentId: id },
    });

    await this.prisma.impediment.delete({
      where: { id },
    });

    this.logger.log(`Impediment deleted: ${id}`);
  }

  async getHistory(id: string): Promise<ImpedimentHistoryResponseDto[]> {
    const impediment = await this.prisma.impediment.findUnique({
      where: { id },
    });

    if (!impediment) {
      throw new NotFoundException('Impediment not found');
    }

    const history = await this.prisma.impedimentHistory.findMany({
      where: { impedimentId: id },
      orderBy: { changedAt: 'desc' },
    });

    return history.map((h) => ImpedimentHistoryResponseDto.fromPrisma(h));
  }
}
