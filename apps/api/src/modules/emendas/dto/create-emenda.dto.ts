import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum EmendaType {
  INDIVIDUAL = 'INDIVIDUAL',
  BANCADA = 'BANCADA',
  RELATOR = 'RELATOR',
  COMISSAO = 'COMISSAO',
}

export class CreateEmendaDto {
  @ApiProperty({ description: 'Parliamentarian ID' })
  @IsNotEmpty()
  @IsUUID()
  parliamentarianId: string;

  @ApiProperty({ description: 'External ID (SIOP)', required: false })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ description: 'Exercise year', example: 2026 })
  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty({ description: 'Amendment number', example: '20260001' })
  @IsNotEmpty()
  @IsString()
  number: string;

  @ApiProperty({ description: 'Type of amendment', enum: EmendaType, default: EmendaType.INDIVIDUAL })
  @IsOptional()
  @IsEnum(EmendaType)
  type?: EmendaType;

  @ApiProperty({ description: 'Object of the amendment', example: 'Construção de UBS' })
  @IsNotEmpty()
  @IsString()
  object: string;

  @ApiProperty({ description: 'Amount', example: 1000000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Source', default: 'MANUAL' })
  @IsOptional()
  @IsString()
  source?: string;
}
