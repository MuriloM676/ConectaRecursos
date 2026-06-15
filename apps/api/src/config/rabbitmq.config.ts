import { Injectable } from '@nestjs/common';

@Injectable()
export class RabbitMQConfig {
  readonly url: string;
  readonly queues: {
    siopSync: string;
    alerts: string;
    reports: string;
  };

  constructor() {
    const user = process.env.RABBITMQ_USER || 'captagov';
    const pass = process.env.RABBITMQ_PASS || 'captagov_rabbit';
    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = process.env.RABBITMQ_PORT || '5672';

    this.url = process.env.RABBITMQ_URL || `amqp://${user}:${pass}@${host}:${port}`;

    this.queues = {
      siopSync: 'siop-sync-queue',
      alerts: 'alerts-queue',
      reports: 'reports-queue',
    };
  }
}
