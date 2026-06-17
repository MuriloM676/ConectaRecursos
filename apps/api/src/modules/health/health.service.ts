import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisConfig } from '@config/redis.config';
import * as net from 'net';

interface HealthStatus {
  [key: string]: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisConfig: RedisConfig,
  ) {}

  async check(): Promise<HealthStatus> {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      api: 'UP',
      database: dbStatus,
      redis: redisStatus,
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'UP';
    } catch (error) {
      this.logger.error(`Database health check failed: ${(error as Error).message}`);
      return 'DOWN';
    }
  }

  private async checkRedis(): Promise<string> {
    try {
      return await new Promise<string>((resolve) => {
        const socket = new net.Socket();
        const timeout = 3000;

        socket.setTimeout(timeout);
        socket.on('connect', () => {
          socket.destroy();
          resolve('UP');
        });
        socket.on('error', () => {
          socket.destroy();
          resolve('DOWN');
        });
        socket.on('timeout', () => {
          socket.destroy();
          resolve('DOWN');
        });

        socket.connect(this.redisConfig.port, this.redisConfig.host);
      });
    } catch {
      return 'DOWN';
    }
  }
}
