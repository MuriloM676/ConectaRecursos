import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, ArrayNotEmpty } from 'class-validator';

const ALERT_TYPES = [
  'EMENDA_RECEIVED',
  'CONVENIO_EXPIRING',
  'IMPEDIMENT_IDENTIFIED',
  'ACCOUNTABILITY_PENDING',
  'SYNC_FAILURE',
] as const;

export class CreateAlertDto {
  @ApiProperty({ description: 'Alert type', enum: ALERT_TYPES })
  @IsString()
  @IsIn(ALERT_TYPES)
  type: string;

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Alert description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Recipient user IDs' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  recipientIds: string[];
}
