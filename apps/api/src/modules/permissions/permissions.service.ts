import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { PermissionResponseDto } from './dto/permission-response.dto';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });

    return permissions.map((p) => PermissionResponseDto.fromPrisma(p));
  }

  async findById(id: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return PermissionResponseDto.fromPrisma(permission);
  }

  async findByCode(code: string): Promise<PermissionResponseDto> {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (!permission) {
      throw new NotFoundException(`Permission '${code}' not found`);
    }

    return PermissionResponseDto.fromPrisma(permission);
  }

  async getRolesByPermission(permissionId: string): Promise<{ id: string; name: string }[]> {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission.rolePermissions.map((rp) => ({
      id: rp.role.id,
      name: rp.role.name,
    }));
  }
}
