import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RoleResponseDto {
  @ApiProperty({ description: 'Role ID' })
  id: string;

  @ApiProperty({ description: 'Role name' })
  name: string;

  @ApiProperty({ description: 'Role description', required: false })
  description: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Associated permissions' })
  permissions?: { id: string; code: string }[];

  static fromPrisma(role: Role & { rolePermissions?: { permission: { id: string; code: string } }[] }): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description || null,
      createdAt: role.createdAt,
      permissions: role.rolePermissions?.map((rp) => ({
        id: rp.permission.id,
        code: rp.permission.code,
      })),
    };
  }
}
