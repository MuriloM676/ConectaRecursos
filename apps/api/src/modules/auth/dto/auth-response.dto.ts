import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn: number;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  accessToken: string;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'If the email is registered, reset instructions were sent',
  })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password reset successfully',
  })
  message: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Logged out successfully',
  })
  message: string;
}
