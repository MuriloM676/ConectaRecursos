import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateEmendaDto } from './create-emenda.dto';

export class UpdateEmendaDto extends PartialType(CreateEmendaDto) {
  @ApiPropertyOptional({ description: 'Current status', example: 'APPROVED' })
  @IsOptional()
  @IsString()
  status?: string;
}
