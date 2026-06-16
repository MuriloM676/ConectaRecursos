import { Injectable, Logger } from '@nestjs/common';
import { SiopConfig } from '@config/siop.config';

@Injectable()
export class SiopClientService {
  private readonly logger = new Logger(SiopClientService.name);

  constructor(private readonly config: SiopConfig) {}

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey ? { 'X-API-KEY': this.config.apiKey } : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const result = await response.json();

    if (result.errors) {
      this.logger.error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
      throw new Error('SIOP GraphQL API error');
    }

    if (!response.ok) {
      this.logger.error(`HTTP Error ${response.status}: ${response.statusText}`);
      throw new Error(`SIOP API HTTP error ${response.status}`);
    }

    return result.data;
  }
}
