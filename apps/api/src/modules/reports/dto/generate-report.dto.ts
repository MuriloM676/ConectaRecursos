import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

const REPORT_TYPES = ['EMENDAS', 'CONVENIOS', 'IMPEDIMENTOS', 'FINANCEIRO', 'EXECUCAO_FISICA'] as const;
const REPORT_FORMATS = ['PDF', 'XLSX', 'CSV'] as const;

export class GenerateReportDto {
  @ApiProperty({ description: 'Report type', enum: REPORT_TYPES })
  @IsString()
  @IsIn(REPORT_TYPES)
  type: string;

  @ApiProperty({ description: 'Output format', enum: REPORT_FORMATS, default: 'PDF' })
  @IsString()
  @IsIn(REPORT_FORMATS)
  format: string;
}
