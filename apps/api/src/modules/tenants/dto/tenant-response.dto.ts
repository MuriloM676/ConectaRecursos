import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Tenant } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty({ description: 'Tenant ID' })
  id: string;

  @ApiProperty({ description: 'Tenant name' })
  name: string;

  @ApiProperty({ description: 'CNPJ' })
  document: string;

  @ApiPropertyOptional({ description: 'City' })
  city?: string | null;

  @ApiPropertyOptional({ description: 'State' })
  state?: string | null;

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  static fromPrisma(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      document: tenant.document,
      city: tenant.city,
      state: tenant.state,
      status: tenant.status,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
