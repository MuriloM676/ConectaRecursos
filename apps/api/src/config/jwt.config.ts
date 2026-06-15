import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtConfig {
  readonly secret: string;
  readonly expiresIn: number;
  readonly refreshSecret: string;
  readonly refreshExpiresIn: number;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'captagov-jwt-secret-dev';
    this.expiresIn = parseInt(process.env.JWT_EXPIRES_IN || '3600', 10);
    this.refreshSecret =
      process.env.JWT_REFRESH_SECRET || 'captagov-jwt-refresh-secret-dev';
    this.refreshExpiresIn = parseInt(
      process.env.JWT_REFRESH_EXPIRES_IN || '604800',
      10,
    );
  }
}
