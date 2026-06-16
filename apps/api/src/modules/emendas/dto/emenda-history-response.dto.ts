import { ApiProperty } from '@nestjs/swagger';
import { EmendaHistory } from '@prisma/client';

export class EmendaHistoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fieldName: string;

  @ApiProperty({ required: false })
  oldValue: string | null;

  @ApiProperty({ required: false })
  newValue: string | null;

  @ApiProperty({ required: false })
  changedBy: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromPrisma(h: EmendaHistory): EmendaHistoryResponseDto {
    return {
      id: h.id,
      fieldName: h.fieldName,
      oldValue: h.oldValue,
      newValue: h.newValue,
      changedBy: h.changedBy,
      createdAt: h.createdAt,
    };
  }
}
