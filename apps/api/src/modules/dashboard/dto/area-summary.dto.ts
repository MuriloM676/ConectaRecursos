import { ApiProperty } from '@nestjs/swagger';

export class AreaSummaryDto {
  @ApiProperty({ description: 'Area/type of emenda' })
  type: string;

  @ApiProperty({ description: 'Count of emendas in this area' })
  count: number;

  @ApiProperty({ description: 'Total amount of emendas in this area' })
  totalAmount: number;
}
