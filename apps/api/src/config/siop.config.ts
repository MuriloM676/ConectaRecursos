import { Injectable } from '@nestjs/common';

@Injectable()
export class SiopConfig {
  readonly apiUrl: string;
  readonly apiToken: string | undefined;

  constructor() {
    this.apiUrl = process.env.SIOP_API_URL || 'https://www.siop.planejamento.gov.br/modulo/impositivo/itens/api';
    this.apiToken = process.env.SIOP_API_TOKEN;
  }
}
