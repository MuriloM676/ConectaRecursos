import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageConfig {
  readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }
}
