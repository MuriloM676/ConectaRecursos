import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfig {
  readonly port: number;
  readonly nodeEnv: string;
  readonly corsOrigin: string;

  constructor() {
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
