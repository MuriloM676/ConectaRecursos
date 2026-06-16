import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { Tenant } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto): Promise<TenantResponseDto> {
    // Check for existing document
    const existing = await this.prisma.tenant.findUnique({
      where: { document: dto.document },
    });

    if (existing) {
      throw new ConflictException('A tenant with this CNPJ already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        document: dto.document,
        city: dto.city,
        state: dto.state,
      },
    });

    this.logger.log(`Tenant created: ${tenant.id} - ${tenant.name}`);

    return TenantResponseDto.fromPrisma(tenant);
  }

  async findAll(): Promise<TenantResponseDto[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((t: Tenant) => TenantResponseDto.fromPrisma(t));
  }

  async findById(id: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return TenantResponseDto.fromPrisma(tenant);
  }

  async update(id: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // If document is being changed, check for conflicts
    if (dto.document && dto.document !== tenant.document) {
      const existing = await this.prisma.tenant.findUnique({
        where: { document: dto.document },
      });

      if (existing) {
        throw new ConflictException('A tenant with this CNPJ already exists');
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Tenant updated: ${updated.id} - ${updated.name}`);

    return TenantResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Soft-delete by deactivating
    await this.prisma.tenant.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    this.logger.log(`Tenant deactivated: ${id}`);
  }
}
