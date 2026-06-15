import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisConfig {
  readonly host: string;
  readonly port: number;
  readonly password: string;

  constructor() {
    this.host = process.env.REDIS_HOST || 'localhost';
    this.port = parseInt(process.env.REDIS_PORT || '6379', 10);
    this.password = process.env.REDIS_PASSWORD || 'captagov_redis';
  }
}
