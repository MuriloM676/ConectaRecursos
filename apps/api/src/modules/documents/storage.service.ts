import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { StorageConfig } from './storage.config';

export interface StoredFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: StorageConfig) {}

  async saveFile(file: StoredFile): Promise<{ filePath: string; fileName: string }> {
    const uploadDir = path.resolve(this.config.uploadDir);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.originalname);
    const storedName = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, storedName);

    await fs.writeFile(filePath, file.buffer);

    this.logger.log(`File saved: ${storedName} (${file.originalname})`);
    return { filePath, fileName: storedName };
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.resolve(filePath);
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${filePath}`);
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        this.logger.error(`Failed to delete file ${filePath}: ${err.message}`);
      }
    }
  }

  async getFile(filePath: string): Promise<Buffer> {
    const fullPath = path.resolve(filePath);
    return fs.readFile(fullPath);
  }
}
