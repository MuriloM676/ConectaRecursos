import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateStepDto {
  @ApiProperty({ description: 'Step order number', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  stepOrder: number;

  @ApiProperty({ description: 'Role that can approve this step', example: 'GESTOR' })
  @IsNotEmpty()
  @IsString()
  approverRole: string;
}
