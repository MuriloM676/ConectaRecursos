import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from '@modules/prisma/prisma.module';
import { RedisModule } from '@modules/redis/redis.module';
import { AuthModule } from '@modules/auth/auth.module';
import { TenantsModule } from '@modules/tenants/tenants.module';
import { UsersModule } from '@modules/users/users.module';
import { RolesModule } from '@modules/roles/roles.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { ParliamentariansModule } from '@modules/parliamentarians/parliamentarians.module';
import { EmendasModule } from '@modules/emendas/emendas.module';
import { SiopModule } from '@modules/siop/siop.module';
import { AuthGuard } from '@common/guards/auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { TenantMiddleware } from '@common/middleware/tenant.middleware';
import { TenantContextInterceptor } from '@common/interceptors/tenant-context.interceptor';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { BullModule } from '@nestjs/bullmq';
import { RedisConfig } from '@config/redis.config';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    BullModule.forRootAsync({
      inject: [RedisConfig],
      useFactory: (config: RedisConfig) => ({
        connection: {
          host: config.host,
          port: config.port,
          password: config.password,
        },
      }),
    }),
    AuthModule,
    TenantsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ParliamentariansModule,
    EmendasModule,
    SiopModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
