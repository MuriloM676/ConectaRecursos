import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateParliamentarianDto {
  @ApiProperty({ description: 'Parliamentarian name', example: 'Deputado Federal João Silva' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Political party', example: 'PT' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 20)
  party: string;

  @ApiProperty({ description: 'State (UF)', example: 'SP' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  state: string;
}
