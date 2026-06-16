import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { CreateImpedimentDto, ImpedimentStatus } from './create-impediment.dto';

export class UpdateImpedimentDto extends PartialType(
  OmitType(CreateImpedimentDto, ['emendaId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Updated status',
    enum: ImpedimentStatus,
    example: ImpedimentStatus.RESOLVED,
  })
  @IsOptional()
  @IsEnum(ImpedimentStatus)
  status?: ImpedimentStatus;

  @ApiPropertyOptional({
    description: 'Resolution notes when status is RESOLVED',
    example: 'Documentação entregue e validada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNotes?: string;
}
