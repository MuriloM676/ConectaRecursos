import { ApiProperty } from '@nestjs/swagger';

export class ParliamentarianSummaryDto {
  @ApiProperty({ description: 'Parliamentarian ID' })
  id: string;

  @ApiProperty({ description: 'Parliamentarian name' })
  name: string;

  @ApiProperty({ description: 'Party' })
  party: string;

  @ApiProperty({ description: 'State' })
  state: string;

  @ApiProperty({ description: 'Total emendas count' })
  emendaCount: number;

  @ApiProperty({ description: 'Total amount of emendas' })
  totalAmount: number;
}
