import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class UpdateStageDto {
  @ApiPropertyOptional({ description: 'Stage name', example: 'Fundação' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Planned percentage for this stage', example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  plannedPercentage?: number;
}
