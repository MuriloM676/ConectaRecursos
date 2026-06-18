import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { AlertResponseDto } from './dto/alert-response.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAlertDto): Promise<AlertResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    const alert = await this.prisma.alert.create({
      data: {
        tenantId,
        type: dto.type,
        title: dto.title,
        description: dto.description || null,
        recipients: {
          create: dto.recipientIds.map((userId) => ({ userId })),
        },
      },
    });

    this.logger.log(`Alert created: ${alert.id} (type: ${dto.type})`);
    return AlertResponseDto.fromPrisma(alert);
  }

  async findAll(query: { page?: number; limit?: number; type?: string }): Promise<PaginatedResult<AlertResponseDto>> {
    const { page = 1, limit = 20, type } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...this.prisma.applyTenantFilter('alert', {}),
      ...(type ? { type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.alert.count({ where }),
    ]);

    return {
      items: items.map((i) => AlertResponseDto.fromPrisma(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUnread(): Promise<AlertResponseDto[]> {
    const where = {
      ...this.prisma.applyTenantFilter('alert', {}),
      read: false,
    };

    const items = await this.prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return items.map((i) => AlertResponseDto.fromPrisma(i));
  }

  async markAsRead(id: string): Promise<AlertResponseDto> {
    const alert = await this.prisma.alert.findUnique({ where: { id } });

    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    const updated = await this.prisma.alert.update({
      where: { id },
      data: { read: true },
    });

    return AlertResponseDto.fromPrisma(updated);
  }

  async markAllAsRead(): Promise<{ count: number }> {
    const tenantId = this.prisma.getTenantId();

    const where = tenantId ? { tenantId, read: false } : { read: false };

    const result = await this.prisma.alert.updateMany({
      where,
      data: { read: true },
    });

    this.logger.log(`Marked ${result.count} alerts as read`);
    return { count: result.count };
  }

  async createTestAlert(userId: string): Promise<AlertResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing');

    const alert = await this.prisma.alert.create({
      data: {
        tenantId,
        type: 'SYNC_FAILURE',
        title: 'Alerta de Teste',
        description: 'Este é um alerta de teste gerado pelo sistema.',
        recipients: {
          create: { userId },
        },
      },
    });

    return AlertResponseDto.fromPrisma(alert);
  }
}
