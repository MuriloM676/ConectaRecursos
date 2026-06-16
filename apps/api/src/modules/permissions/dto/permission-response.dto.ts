import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@prisma/client';

export class PermissionResponseDto {
  @ApiProperty({ description: 'Permission ID' })
  id: string;

  @ApiProperty({ description: 'Permission code (e.g., "user:create")' })
  code: string;

  @ApiProperty({ description: 'Permission description', required: false })
  description: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  static fromPrisma(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      code: permission.code,
      description: permission.description || null,
      createdAt: permission.createdAt,
    };
  }
}
