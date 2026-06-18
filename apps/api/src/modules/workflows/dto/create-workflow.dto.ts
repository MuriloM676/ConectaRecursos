import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateWorkflowDto {
  @ApiProperty({ description: 'Workflow name', example: 'Fluxo Prestação de Contas' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;
}
