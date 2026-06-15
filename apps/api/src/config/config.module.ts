import { Module, Global } from '@nestjs/common';
import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';
import { JwtConfig } from './jwt.config';
import { RedisConfig } from './redis.config';
import { RabbitMQConfig } from './rabbitmq.config';

@Global()
@Module({
  providers: [AppConfig, DatabaseConfig, JwtConfig, RedisConfig, RabbitMQConfig],
  exports: [AppConfig, DatabaseConfig, JwtConfig, RedisConfig, RabbitMQConfig],
})
export class ConfigModule {}
