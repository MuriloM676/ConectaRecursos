import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ description: 'Convenio ID', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  convenioId: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prestação referente ao período' })
  @IsOptional()
  @IsString()
  notes?: string;
}
