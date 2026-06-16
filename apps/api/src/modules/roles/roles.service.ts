import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto): Promise<RoleResponseDto> {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Role '${dto.name}' already exists`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
    });

    this.logger.log(`Role created: ${role.name}`);

    return RoleResponseDto.fromPrisma(role);
  }

  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => RoleResponseDto.fromPrisma(r));
  }

  async findById(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return RoleResponseDto.fromPrisma(role);
  }

  async findByName(name: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { name },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role '${name}' not found`);
    }

    return RoleResponseDto.fromPrisma(role);
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: true },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // If name is being changed, check for conflicts
    if (dto.name && dto.name !== role.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: dto.name },
      });

      if (existing) {
        throw new ConflictException(`Role '${dto.name}' already exists`);
      }
    }

    // Update permissions if provided
    if (dto.permissionIds) {
      // Delete existing permissions
      await this.prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Create new permissions
      if (dto.permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
    });

    this.logger.log(`Role updated: ${updated.name}`);

    return RoleResponseDto.fromPrisma(updated);
  }

  async remove(id: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if role has users assigned
    const userCount = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ConflictException(
        `Cannot delete role '${role.name}': ${userCount} user(s) are assigned to it`,
      );
    }

    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    await this.prisma.role.delete({
      where: { id },
    });

    this.logger.log(`Role deleted: ${role.name}`);
  }

  async getPermissionsByRole(roleId: string): Promise<{ id: string; code: string }[]> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: { select: { id: true, code: true } } },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role.rolePermissions.map((rp) => ({
      id: rp.permission.id,
      code: rp.permission.code,
    }));
  }
}
