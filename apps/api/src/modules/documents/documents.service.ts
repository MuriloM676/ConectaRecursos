import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { StorageService, StoredFile } from './storage.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import { PaginatedResult } from '@common/dto/pagination.dto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(
    file: StoredFile,
    entityType: string,
    entityId: string,
    userId?: string,
  ): Promise<DocumentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: PDF, DOCX, XLSX, PNG, JPG`,
      );
    }

    const { filePath } = await this.storage.saveFile(file);

    const latest = await this.prisma.document.findFirst({
      where: { entityType, entityId, deletedAt: null },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const doc = await this.prisma.document.create({
      data: {
        tenantId: this.prisma.getTenantId() || '',
        entityType,
        entityId,
        fileName: file.originalname,
        filePath,
        mimeType: file.mimetype,
        version: (latest?.version || 0) + 1,
        uploadedBy: userId || null,
      },
    });

    this.logger.log(`Document uploaded: ${doc.id} (${file.originalname}, v${doc.version})`);
    return DocumentResponseDto.fromPrisma(doc);
  }

  async findAll(
    query: { page?: number; limit?: number; entityType?: string; entityId?: string },
  ): Promise<PaginatedResult<DocumentResponseDto>> {
    const { page = 1, limit = 20, entityType, entityId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...this.prisma.applyTenantFilter('document', {}),
      deletedAt: null,
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items: items.map((i) => DocumentResponseDto.fromPrisma(i)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<DocumentResponseDto> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) {
      throw new NotFoundException('Document not found');
    }
    return DocumentResponseDto.fromPrisma(doc);
  }

  async download(id: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) {
      throw new NotFoundException('Document not found');
    }

    const buffer = await this.storage.getFile(doc.filePath);
    return { buffer, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  async remove(id: string): Promise<void> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc || doc.deletedAt) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Document soft-deleted: ${id}`);
  }
}
