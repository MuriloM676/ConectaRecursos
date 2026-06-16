import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisService } from '@modules/redis/redis.service';
import { PasswordHashService } from './services/password-hash.service';
import { JwtConfig } from '@config/jwt.config';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  LoginResponseDto,
  RefreshResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly passwordHash: PasswordHashService,
    private readonly jwtConfig: JwtConfig,
  ) {}

  // ===================== T040: LOGIN =====================
  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.active) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.passwordHash.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const attemptsKey = `login_attempts:${user.id}`;
      const attempts = await this.redis.get(attemptsKey);
      const currentAttempts = attempts ? parseInt(attempts, 10) + 1 : 1;
      await this.redis.set(attemptsKey, String(currentAttempts), 900);

      if (currentAttempts >= 5) {
        this.logger.warn(
          `Account locked due to multiple failed logins: ${user.email}`,
        );
        throw new UnauthorizedException(
          'Account temporarily locked due to multiple failed attempts. Try again in 15 minutes.',
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // Clear failed attempts
    await this.redis.del(`login_attempts:${user.id}`);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const permissions = user.role.rolePermissions.map(
      (rp: { permission: { code: string } }) => rp.permission.code,
    );

    return this.generateTokens(
      user.id,
      user.email,
      user.tenantId,
      user.role.name,
      permissions,
      ipAddress,
    );
  }

  // ===================== T041: REFRESH TOKEN =====================
  async refresh(refreshToken: string): Promise<RefreshResponseDto> {
    let payload: { sub: string; type: string };

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtConfig.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Check if refresh token exists in Redis
    const refreshKey = `refresh_token:${refreshToken}`;
    const storedUserId = await this.redis.get(refreshKey);

    if (!storedUserId || storedUserId !== payload.sub) {
      await this.invalidateAllUserTokens(payload.sub);
      throw new UnauthorizedException(
        'Refresh token has been reused. All sessions invalidated.',
      );
    }

    // Delete used refresh token (rotation)
    await this.redis.del(refreshKey);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions = user.role.rolePermissions.map(
      (rp: { permission: { code: string } }) => rp.permission.code,
    );

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role.name,
        permissions,
      },
      {
        secret: this.jwtConfig.secret,
        expiresIn: this.jwtConfig.expiresIn,
      },
    );

    return { accessToken };
  }

  // ===================== T042: LOGOUT =====================
  async logout(refreshToken: string): Promise<LogoutResponseDto> {
    const refreshKey = `refresh_token:${refreshToken}`;
    await this.redis.del(refreshKey);
    this.logger.log('User logged out');
    return { message: 'Logged out successfully' };
  }

  // ===================== T043: FORGOT PASSWORD =====================
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.active) {
      return {
        message: 'If the email is registered, reset instructions were sent',
      };
    }

    const resetToken = crypto.randomUUID();
    const resetKey = `password_reset:${resetToken}`;
    await this.redis.set(resetKey, user.id, 1800);

    this.logger.log(
      `Password reset requested for ${user.email}. Token: ${resetToken}`,
    );

    return {
      message: 'If the email is registered, reset instructions were sent',
    };
  }

  // ===================== T044: RESET PASSWORD =====================
  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const resetKey = `password_reset:${dto.token}`;
    const userId = await this.redis.get(resetKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordHash.hash(dto.password);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(resetKey);
    await this.invalidateAllUserTokens(userId);

    this.logger.log(`Password reset for user ${userId}`);

    return { message: 'Password reset successfully' };
  }

  // ===================== HELPERS =====================
  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    role: string,
    permissions: string[],
    ipAddress?: string,
  ): Promise<LoginResponseDto> {
    const payload = { sub: userId, email, tenantId, role, permissions };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.jwtConfig.secret,
      expiresIn: this.jwtConfig.expiresIn,
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: this.jwtConfig.refreshExpiresIn,
      },
    );

    const refreshKey = `refresh_token:${refreshToken}`;
    await this.redis.set(refreshKey, userId, this.jwtConfig.refreshExpiresIn);

    this.logger.log(
      `User logged in: ${email} [${ipAddress || 'unknown'}]`,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtConfig.expiresIn,
    };
  }

  private async invalidateAllUserTokens(userId: string): Promise<void> {
    this.logger.warn(`Invalidating all refresh tokens for user ${userId}`);
  }
}