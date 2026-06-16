import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RedisModule } from '@modules/redis/redis.module';
import { AuthModule } from '@modules/auth/auth.module';
import { AuthGuard } from '@common/guards/auth.guard';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, AuthModule],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
