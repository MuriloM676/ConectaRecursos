import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ValidationExceptionFilter } from '@common/filters/validation-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { TenantContextInterceptor } from '@common/interceptors/tenant-context.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter(), new ValidationExceptionFilter());

  // Global interceptors (now registered via APP_INTERCEPTOR in AppModule)
  // app.useGlobalInterceptors(new TenantContextInterceptor(), new ResponseInterceptor());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('CaptaGov API')
    .setDescription(
      'Plataforma SaaS Multi-Tenant para gestão de emendas parlamentares, convênios e prestação de contas',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'api-key')
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('Tenants', 'Gestão de prefeituras (tenants)')
    .addTag('Users', 'Gestão de usuários')
    .addTag('Roles', 'Papéis e permissões')
    .addTag('Parliamentarians', 'Parlamentares')
    .addTag('Emendas', 'Emendas parlamentares')
    .addTag('SIOP', 'Sincronização SIOP')
    .addTag('Impediments', 'Impedimentos')
    .addTag('Convênios', 'Convênios')
    .addTag('Financial Schedule', 'Cronograma financeiro')
    .addTag('Physical Execution', 'Execução física')
    .addTag('Accountability', 'Prestação de contas')
    .addTag('Documents', 'Documentos')
    .addTag('Alerts', 'Alertas e notificações')
    .addTag('Dashboard', 'Dashboard executivo')
    .addTag('Reports', 'Relatórios')
    .addTag('Audit Logs', 'Logs de auditoria')
    .addTag('Integrations', 'Integrações')
    .addTag('Public API', 'API pública')
    .addTag('Health', 'Health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Start server
  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 CaptaGov API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
