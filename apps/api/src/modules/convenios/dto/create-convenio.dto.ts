import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateConvenioDto {
  @ApiProperty({ description: 'Emenda ID linked to this convenio', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  emendaId: string;

  @ApiProperty({ description: 'Convenio number', example: 'CV-2026-001' })
  @IsNotEmpty()
  @IsString()
  number: string;

  @ApiProperty({ description: 'Object of the convenio', example: 'Construção de UBS' })
  @IsNotEmpty()
  @IsString()
  object: string;

  @ApiProperty({ description: 'Total amount of the convenio', example: 2500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: 'Counterpart amount (tenant contribution)', example: 200000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  counterpartAmount: number;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2027-01-01' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Initial status', example: 'DRAFT' })
  @IsOptional()
  @IsString()
  status?: string;
}
