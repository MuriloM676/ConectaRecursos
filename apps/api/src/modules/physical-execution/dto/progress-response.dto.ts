import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgressResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  stageId: string;

  @ApiProperty()
  stageName: string;

  @ApiProperty()
  percentage: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdBy: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromPrisma(progress: any): ProgressResponseDto {
    const dto = new ProgressResponseDto();
    dto.id = progress.id;
    dto.stageId = progress.stageId;
    dto.stageName = progress.stage?.name || 'N/A';
    dto.percentage = Number(progress.percentage);
    dto.notes = progress.notes;
    dto.createdBy = progress.createdBy;
    dto.createdAt = progress.createdAt;
    return dto;
  }
}
