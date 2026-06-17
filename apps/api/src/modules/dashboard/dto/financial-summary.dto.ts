import { ApiProperty } from '@nestjs/swagger';

export class MonthlyFinancialDto {
  @ApiProperty({ description: 'Month (1-12)' })
  month: number;

  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Total expected amount for the month' })
  expectedAmount: number;

  @ApiProperty({ description: 'Total received amount for the month' })
  receivedAmount: number;
}

export class FinancialSummaryDto {
  @ApiProperty({ description: 'Total expected across all schedules' })
  totalExpected: number;

  @ApiProperty({ description: 'Total received across all schedules' })
  totalReceived: number;

  @ApiProperty({ description: 'Balance (received - expected)' })
  balance: number;

  @ApiProperty({ description: 'Monthly breakdown', type: [MonthlyFinancialDto] })
  monthlyBreakdown: MonthlyFinancialDto[];
}
