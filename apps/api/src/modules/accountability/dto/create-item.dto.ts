import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ description: 'Item description', example: 'Material de construção' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Item amount', example: 50000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;
}
