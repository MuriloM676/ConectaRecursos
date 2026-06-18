import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateFinancialScheduleDto {
  @ApiPropertyOptional({ description: 'Expected amount for the installment', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expectedAmount?: number;

  @ApiPropertyOptional({ description: 'Expected date (YYYY-MM-DD)', example: '2026-09-01' })
  @IsOptional()
  @IsString()
  expectedDate?: string;

  @ApiPropertyOptional({ description: 'Received amount', example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  receivedAmount?: number;

  @ApiPropertyOptional({ description: 'Received date (YYYY-MM-DD)', example: '2026-09-15' })
  @IsOptional()
  @IsString()
  receivedDate?: string;

  @ApiPropertyOptional({ description: 'Status', example: 'RECEIVED' })
  @IsOptional()
  @IsString()
  status?: string;
}
