import { ApiProperty } from '@nestjs/swagger';
import { Emenda, Parliamentarian } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class EmendaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  parliamentarianId: string;

  @ApiProperty()
  parliamentarianName: string;

  @ApiProperty({ required: false })
  externalId: string | null;

  @ApiProperty()
  year: number;

  @ApiProperty()
  number: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  object: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  source: string;

  @ApiProperty()
  createdAt: Date;

  static fromPrisma(e: Emenda & { parliamentarian?: Parliamentarian }): EmendaResponseDto {
    return {
      id: e.id,
      tenantId: e.tenantId,
      parliamentarianId: e.parliamentarianId,
      parliamentarianName: e.parliamentarian?.name || 'N/A',
      externalId: e.externalId,
      year: e.year,
      number: e.number,
      type: e.type,
      object: e.object,
      amount: Number(e.amount),
      status: e.status,
      source: e.source,
      createdAt: e.createdAt,
    };
  }
}
