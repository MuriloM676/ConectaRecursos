import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateProgressDto {
  @ApiProperty({ description: 'Stage ID', example: 'uuid' })
  @IsNotEmpty()
  @IsString()
  stageId: string;

  @ApiProperty({ description: 'Achieved percentage', example: 25 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({ description: 'Notes about progress', example: 'Fundação concluída' })
  @IsOptional()
  @IsString()
  notes?: string;
}
