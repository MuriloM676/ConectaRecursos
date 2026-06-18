import { ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateConvenioDto } from './create-convenio.dto';

export class UpdateConvenioDto extends OmitType(PartialType(CreateConvenioDto), ['emendaId'] as const) {
  @ApiPropertyOptional({ description: 'Updated status', example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

