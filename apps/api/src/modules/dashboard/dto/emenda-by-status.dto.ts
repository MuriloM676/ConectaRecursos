import { ApiProperty } from '@nestjs/swagger';

export class EmendaByStatusDto {
  @ApiProperty({ description: 'Emenda status' })
  status: string;

  @ApiProperty({ description: 'Count of emendas with this status' })
  count: number;

  @ApiProperty({ description: 'Total amount of emendas with this status' })
  totalAmount: number;
}
