import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Impediment } from '@prisma/client';

export class ImpedimentResponseDto {
  @ApiProperty({ description: 'Impediment ID' })
  id: string;

  @ApiProperty({ description: 'Emenda ID' })
  emendaId: string;

  @ApiPropertyOptional({ description: 'Emenda number', required: false })
  emendaNumber?: string;

  @ApiPropertyOptional({ description: 'External ID from SIOP', required: false })
  externalId: string | null;

  @ApiProperty({ description: 'Impediment description' })
  description: string;

  @ApiProperty({ description: 'Current status', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'] })
  status: string;

  @ApiProperty({ description: 'Opening timestamp' })
  openedAt: Date;

  @ApiPropertyOptional({ description: 'Resolution timestamp', required: false })
  resolvedAt: Date | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  static fromPrisma(
    impediment: Impediment & { emenda?: { number?: string } },
  ): ImpedimentResponseDto {
    return {
      id: impediment.id,
      emendaId: impediment.emendaId,
      emendaNumber: impediment.emenda?.number,
      externalId: impediment.externalId || null,
      description: impediment.description,
      status: impediment.status,
      openedAt: impediment.openedAt,
      resolvedAt: impediment.resolvedAt,
      createdAt: impediment.createdAt,
      updatedAt: impediment.updatedAt,
    };
  }
}
