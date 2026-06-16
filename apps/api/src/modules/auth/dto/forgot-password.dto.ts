import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email to receive password reset instructions',
    example: 'admin@captagov.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;
}
