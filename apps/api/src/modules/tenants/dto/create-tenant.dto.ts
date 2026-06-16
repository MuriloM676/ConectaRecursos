import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Tenant name (city/prefeitura name)',
    example: 'Prefeitura Municipal de São Paulo',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'CNPJ (only numbers)',
    example: '12345678000199',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, { message: 'Document must be a valid CNPJ with 14 digits' })
  document: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'São Paulo',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State abbreviation (BR)',
    example: 'SP',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'State must be a 2-letter uppercase abbreviation',
  })
  state?: string;
}
