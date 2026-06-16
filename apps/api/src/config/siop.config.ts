import { Injectable } from '@nestjs/common';

@Injectable()
export class SiopConfig {
  readonly apiUrl: string;
  readonly apiKey: string | undefined;

  constructor() {
    this.apiUrl = process.env.SIOP_API_URL || 'https://api.siop.gov.br/graphql';
    this.apiKey = process.env.SIOP_API_KEY;
  }
}
