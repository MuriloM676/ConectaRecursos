import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountabilityReport } from '@prisma/client';

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Convenio ID' })
  convenioId: string;

  @ApiPropertyOptional({ description: 'Convenio number' })
  convenioNumber?: string;

  @ApiProperty({ description: 'Current status', enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] })
  status: string;

  @ApiPropertyOptional({ description: 'Submission timestamp' })
  submittedAt: Date | null;

  @ApiPropertyOptional({ description: 'Approval timestamp' })
  approvedAt: Date | null;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  static fromPrisma(report: AccountabilityReport & { convenio?: { number?: string } }): ReportResponseDto {
    const dto = new ReportResponseDto();
    dto.id = report.id;
    dto.convenioId = report.convenioId;
    dto.convenioNumber = report.convenio?.number;
    dto.status = report.status;
    dto.submittedAt = report.submittedAt;
    dto.approvedAt = report.approvedAt;
    dto.notes = report.notes;
    dto.createdAt = report.createdAt;
    dto.updatedAt = report.updatedAt;
    return dto;
  }
}
