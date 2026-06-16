import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisConfig } from '@config/redis.config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;

  constructor(private readonly config: RedisConfig) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.config.host,
        port: this.config.port,
      },
      password: this.config.password,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, { EX: ttlSeconds });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
