import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document } from '@prisma/client';

export class DocumentResponseDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'Entity type (e.g., EMENDA, CONVENIO)' })
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  entityId: string;

  @ApiProperty({ description: 'Original file name' })
  fileName: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ description: 'File version number' })
  version: number;

  @ApiPropertyOptional({ description: 'User who uploaded' })
  uploadedBy: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  static fromPrisma(doc: Document): DocumentResponseDto {
    const dto = new DocumentResponseDto();
    dto.id = doc.id;
    dto.entityType = doc.entityType;
    dto.entityId = doc.entityId;
    dto.fileName = doc.fileName;
    dto.mimeType = doc.mimeType;
    dto.version = doc.version;
    dto.uploadedBy = doc.uploadedBy;
    dto.createdAt = doc.createdAt;
    return dto;
  }
}
