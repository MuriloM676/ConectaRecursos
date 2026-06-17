import { ApiProperty } from '@nestjs/swagger';
import { GeneratedReport } from '@prisma/client';

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id: string;

  @ApiProperty({ description: 'Report type' })
  reportType: string;

  @ApiProperty({ description: 'File format' })
  format: string;

  @ApiProperty({ description: 'Generated at' })
  generatedAt: Date;

  static fromPrisma(report: GeneratedReport): ReportResponseDto {
    const dto = new ReportResponseDto();
    dto.id = report.id;
    dto.reportType = report.reportType;
    dto.format = report.format;
    dto.generatedAt = report.generatedAt;
    return dto;
  }
}
