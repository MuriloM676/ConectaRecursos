import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateFinancialScheduleDto {
  @ApiProperty({ description: 'Expected amount for the installment', example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  expectedAmount: number;

  @ApiProperty({ description: 'Expected date (YYYY-MM-DD)', example: '2026-09-01' })
  @IsNotEmpty()
  @IsString()
  expectedDate: string;

  @ApiPropertyOptional({ description: 'Status', example: 'PENDING' })
  @IsOptional()
  @IsString()
  status?: string;
}
