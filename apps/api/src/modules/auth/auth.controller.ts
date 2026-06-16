import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '@common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  LoginResponseDto,
  RefreshResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user',
    description: 'Authenticate with email and password to obtain JWT tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<LoginResponseDto> {
    return this.authService.login(dto, req.ip);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Use a valid refresh token to obtain a new access token. The used refresh token is invalidated (rotation).',
  })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshDto): Promise<RefreshResponseDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidates the provided refresh token.',
  })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  async logout(@Body() dto: RefreshDto): Promise<LogoutResponseDto> {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset token to the provided email if registered.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Reset instructions sent',
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using the token received via email.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }
}
