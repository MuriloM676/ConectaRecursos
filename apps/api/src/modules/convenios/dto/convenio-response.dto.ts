import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Convenio } from '@prisma/client';

export class ConvenioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  emendaId: string;

  @ApiProperty()
  emendaNumber: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  object: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  counterpartAmount: number;

  @ApiPropertyOptional()
  startDate: Date | null;

  @ApiPropertyOptional()
  endDate: Date | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Total received amount' })
  receivedAmount?: number;

  static fromPrisma(convenio: Convenio & { emenda?: { number?: string } }, receivedAmount?: number): ConvenioResponseDto {
    const dto = new ConvenioResponseDto();
    dto.id = convenio.id;
    dto.tenantId = convenio.tenantId;
    dto.emendaId = convenio.emendaId;
    dto.emendaNumber = convenio.emenda?.number || 'N/A';
    dto.number = convenio.number;
    dto.object = convenio.object;
    dto.totalAmount = Number(convenio.totalAmount);
    dto.counterpartAmount = Number(convenio.counterpartAmount);
    dto.startDate = convenio.startDate;
    dto.endDate = convenio.endDate;
    dto.status = convenio.status;
    dto.createdAt = convenio.createdAt;
    dto.receivedAmount = receivedAmount;
    return dto;
  }
}

