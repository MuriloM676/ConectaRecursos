import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImpedimentHistory } from '@prisma/client';

export class ImpedimentHistoryResponseDto {
  @ApiProperty({ description: 'History entry ID' })
  id: string;

  @ApiProperty({ description: 'Impediment ID' })
  impedimentId: string;

  @ApiPropertyOptional({ description: 'Previous status', required: false })
  oldStatus: string | null;

  @ApiPropertyOptional({ description: 'New status', required: false })
  newStatus: string | null;

  @ApiProperty({ description: 'Change timestamp' })
  changedAt: Date;

  static fromPrisma(history: ImpedimentHistory): ImpedimentHistoryResponseDto {
    return {
      id: history.id,
      impedimentId: history.impedimentId,
      oldStatus: history.oldStatus,
      newStatus: history.newStatus,
      changedAt: history.changedAt,
    };
  }
}
