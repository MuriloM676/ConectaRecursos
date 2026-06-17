import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../health.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisConfig } from '@config/redis.config';
import * as net from 'net';

jest.mock('net', () => ({
  Socket: jest.fn().mockImplementation(() => ({
    setTimeout: jest.fn().mockReturnThis(),
    on: jest.fn().mockImplementation(function (this: any, event: string, cb: Function) {
      if (event === 'connect') setTimeout(cb, 0);
      return this;
    }),
    destroy: jest.fn(),
    connect: jest.fn().mockReturnThis(),
  })),
}));

describe('HealthService', () => {
  let service: HealthService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisConfig, useValue: { host: 'localhost', port: 6379 } },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  describe('check', () => {
    it('should return UP when all services are healthy', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      const result = await service.check();

      expect(result.api).toBe('UP');
      expect(result.database).toBe('UP');
      expect(result.redis).toBe('UP');
    });

    it('should report database DOWN on error', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await service.check();

      expect(result.api).toBe('UP');
      expect(result.database).toBe('DOWN');
    });
  });
});
