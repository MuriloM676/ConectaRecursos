import { ApiProperty } from '@nestjs/swagger';
import { StageResponseDto } from './stage-response.dto';
import { ProgressResponseDto } from './progress-response.dto';

export class ConvenioProgressResponseDto {
  @ApiProperty()
  convenioId: string;

  @ApiProperty()
  overallPercentage: number;

  @ApiProperty({ type: [StageResponseDto] })
  stages: StageResponseDto[];

  @ApiProperty({ type: [ProgressResponseDto] })
  recentProgress: ProgressResponseDto[];

  static fromPrisma(convenioId: string, stages: any[], allProgress: any[]): ConvenioProgressResponseDto {
    const dto = new ConvenioProgressResponseDto();
    dto.convenioId = convenioId;

    const stageDtos = stages.map((s) => StageResponseDto.fromPrisma(s));
    dto.stages = stageDtos;

    const progressDtos = allProgress.map((p) => ProgressResponseDto.fromPrisma(p));
    dto.recentProgress = progressDtos;

    const totalPlanned = stages.reduce((sum, s) => sum + Number(s.plannedPercentage), 0);
    const weightedActual = stages.reduce(
      (sum, s) => sum + (Number(s.actualPercentage) * Number(s.plannedPercentage)) / 100,
      0,
    );
    dto.overallPercentage = totalPlanned > 0 ? Math.round((weightedActual / totalPlanned) * 100) : 0;

    return dto;
  }
}
