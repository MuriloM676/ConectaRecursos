import { Injectable, Logger } from '@nestjs/common';
import { SiopConfig } from '@config/siop.config';

@Injectable()
export class SiopClientService {
  private readonly logger = new Logger(SiopClientService.name);

  constructor(private readonly config: SiopConfig) {}

  async query<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiToken) {
      headers['Authorization'] = `Bearer ${this.config.apiToken}`;
    }

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`HTTP Error ${response.status}: ${response.statusText} - ${body}`);
      throw new Error(`SIOP API HTTP error ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      this.logger.error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
      throw new Error('SIOP GraphQL API error');
    }

    return result.data;
  }
}
