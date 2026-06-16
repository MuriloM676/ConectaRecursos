import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum ImpedimentStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

export class CreateImpedimentDto {
  @ApiProperty({
    description: 'Emenda ID to link the impediment',
    example: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  emendaId: string;

  @ApiProperty({
    description: 'Description of the impediment',
    example: 'Documentação pendente do convenente',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    description: 'External ID from SIOP integration',
    example: 'IMP-2026-0001',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Initial status',
    enum: ImpedimentStatus,
    default: ImpedimentStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(ImpedimentStatus)
  status?: ImpedimentStatus;
}
