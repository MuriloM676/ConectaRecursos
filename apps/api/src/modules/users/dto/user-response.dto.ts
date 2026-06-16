import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User status' })
  active: boolean;

  @ApiProperty({ description: 'Role ID' })
  roleId: string;

  @ApiProperty({ description: 'Role name', required: false })
  roleName?: string;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  lastLogin: Date | null;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  static fromPrisma(user: User & { role?: { name: string } }): UserResponseDto {
    return {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      active: user.active,
      roleId: user.roleId,
      roleName: user.role?.name,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }
}
