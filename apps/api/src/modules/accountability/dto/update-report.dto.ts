import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateReportDto {
  @ApiPropertyOptional({ description: 'Updated notes', example: 'Notas revisadas' })
  @IsOptional()
  @IsString()
  notes?: string;
}
