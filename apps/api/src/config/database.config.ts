import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseConfig {
  readonly url: string;

  constructor() {
    this.url =
      process.env.DATABASE_URL ||
      'postgresql://captagov:captagov_dev@localhost:5432/captagov?schema=public';
  }
}
