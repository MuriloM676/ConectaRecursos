import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({
    description: 'Tenant status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^(ACTIVE|INACTIVE|SUSPENDED)$/, {
    message: 'Status must be ACTIVE, INACTIVE, or SUSPENDED',
  })
  status?: string;
}
