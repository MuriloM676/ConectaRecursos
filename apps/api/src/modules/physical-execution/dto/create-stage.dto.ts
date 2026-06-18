import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateStageDto {
  @ApiProperty({ description: 'Stage name', example: 'Fundação' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Planned percentage for this stage', example: 25 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  plannedPercentage: number;
}
