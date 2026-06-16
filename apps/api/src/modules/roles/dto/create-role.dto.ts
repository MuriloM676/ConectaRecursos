import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name (unique, uppercase snake_case)',
    example: 'GESTOR',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Gestor municipal com permissões de gerenciamento',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to this role',
    example: ['uuid-permission-1', 'uuid-permission-2'],
    required: false,
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
