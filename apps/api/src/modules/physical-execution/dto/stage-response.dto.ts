import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  convenioId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  plannedPercentage: number;

  @ApiProperty()
  actualPercentage: number;

  @ApiPropertyOptional()
  lastProgressNotes?: string;

  @ApiPropertyOptional()
  lastProgressDate?: Date;

  static fromPrisma(stage: any): StageResponseDto {
    const dto = new StageResponseDto();
    dto.id = stage.id;
    dto.convenioId = stage.convenioId;
    dto.name = stage.name;
    dto.plannedPercentage = Number(stage.plannedPercentage);
    dto.actualPercentage = Number(stage.actualPercentage);
    if (stage.progress && stage.progress.length > 0) {
      const last = stage.progress[stage.progress.length - 1];
      dto.lastProgressNotes = last.notes;
      dto.lastProgressDate = last.createdAt;
    }
    return dto;
  }
}
