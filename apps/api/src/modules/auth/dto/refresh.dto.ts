import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token previously obtained from login',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
