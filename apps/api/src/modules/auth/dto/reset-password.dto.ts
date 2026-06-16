import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token sent to user email',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPass@456',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
