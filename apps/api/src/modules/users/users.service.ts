import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { PasswordHashService } from '@modules/auth/services/password-hash.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto, PaginatedResult } from '@common/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHashService: PasswordHashService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const tenantId = this.prisma.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context is missing');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`User with email '${dto.email}' already exists`);
    }

    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${dto.roleId}' not found`);
    }

    const passwordHash = await this.passwordHashService.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        tenantId,
        roleId: dto.roleId,
        active: true,
      },
      include: {
        role: { select: { name: true } },
      },
    });

    this.logger.log(`User created: ${user.email} (Tenant: ${tenantId})`);

    return UserResponseDto.fromPrisma(user);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResult<UserResponseDto>> {
    const tenantId = this.prisma.getTenantId();
    const { page = 1, limit = 20, search } = pagination;
    const skip = (page - 1) * limit;

    const where = this.prisma.applyTenantFilter('user', {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    });

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          role: { select: { name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((u) => UserResponseDto.fromPrisma(u)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<UserResponseDto> {
    const where = this.prisma.applyTenantFilter('user', { id, deletedAt: null });
    const user = await this.prisma.user.findFirst({
      where,
      include: {
        role: { select: { name: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromPrisma(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const where = this.prisma.applyTenantFilter('user', { id, deletedAt: null });
    const user = await this.prisma.user.findFirst({ where });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email conflict if being changed
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException(`User with email '${dto.email}' already exists`);
      }
    }

    // Verify role if being changed
    if (dto.roleId && dto.roleId !== user.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });

      if (!role) {
        throw new NotFoundException(`Role with ID '${dto.roleId}' not found`);
      }
    }

    let passwordHash = user.passwordHash;
    if (dto.password) {
      passwordHash = await this.passwordHashService.hash(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
        active: dto.active,
      },
      include: {
        role: { select: { name: true } },
      },
    });

    this.logger.log(`User updated: ${updated.email}`);

    return UserResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    const where = this.prisma.applyTenantFilter('user', { id, deletedAt: null });
    const user = await this.prisma.user.findFirst({ where });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });

    this.logger.log(`User soft-deleted: ${user.email}`);
  }
}
