import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from '../documents.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { StorageService } from '../storage.service';
import { StorageConfig } from '../storage.config';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;
  let storage: any;

  const mockDoc = {
    id: 'doc-1',
    tenantId: 'tenant-1',
    entityType: 'CONVENIO',
    entityId: 'conv-1',
    fileName: 'relatorio.pdf',
    filePath: '/uploads/file.pdf',
    mimeType: 'application/pdf',
    version: 1,
    uploadedBy: 'user-1',
    createdAt: new Date(),
    deletedAt: null,
  };

  const mockFile = {
    originalname: 'relatorio.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('test'),
    size: 4,
  } as Express.Multer.File;

  beforeEach(async () => {
    prisma = {
      document: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      getTenantId: jest.fn().mockReturnValue('tenant-1'),
      applyTenantFilter: jest.fn((_model, where) => where || {}),
    };

    storage = {
      saveFile: jest.fn(),
      getFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        StorageConfig,
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('upload', () => {
    it('should upload a file and create document record', async () => {
      storage.saveFile.mockResolvedValue({ filePath: '/uploads/file.pdf', fileName: 'file.pdf' });
      prisma.document.findFirst.mockResolvedValue(null);
      prisma.document.create.mockResolvedValue(mockDoc);

      const result = await service.upload(mockFile, 'CONVENIO', 'conv-1', 'user-1');
      expect(result.id).toBe('doc-1');
      expect(result.fileName).toBe('relatorio.pdf');
      expect(result.version).toBe(1);
    });

    it('should increment version for existing documents', async () => {
      storage.saveFile.mockResolvedValue({ filePath: '/uploads/file2.pdf', fileName: 'file2.pdf' });
      prisma.document.findFirst.mockResolvedValue({ version: 3 });
      prisma.document.create.mockResolvedValue({ ...mockDoc, id: 'doc-2', version: 4 });

      const result = await service.upload(mockFile, 'CONVENIO', 'conv-1', 'user-1');
      expect(result.version).toBe(4);
    });

    it('should throw if file is not provided', async () => {
      await expect(service.upload(null as any, 'CONVENIO', 'conv-1', 'user-1')).rejects.toThrow('File is required');
    });

    it('should reject invalid file types', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/exe' };

      await expect(service.upload(invalidFile, 'CONVENIO', 'conv-1', 'user-1')).rejects.toThrow('Invalid file type');
    });
  });

  describe('findAll', () => {
    it('should return paginated documents', async () => {
      prisma.document.findMany.mockResolvedValue([mockDoc]);
      prisma.document.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a document by id', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDoc);

      const result = await service.findById('doc-1');
      expect(result.id).toBe('doc-1');
    });

    it('should throw if not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(service.findById('invalid')).rejects.toThrow('Document not found');
    });

    it('should throw if soft-deleted', async () => {
      prisma.document.findUnique.mockResolvedValue({ ...mockDoc, deletedAt: new Date() });

      await expect(service.findById('doc-1')).rejects.toThrow('Document not found');
    });
  });

  describe('download', () => {
    it('should return file buffer and metadata', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDoc);
      storage.getFile.mockResolvedValue(Buffer.from('file-content'));

      const result = await service.download('doc-1');
      expect(result.fileName).toBe('relatorio.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.buffer).toBeDefined();
    });

    it('should throw if not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(service.download('invalid')).rejects.toThrow('Document not found');
    });
  });

  describe('remove', () => {
    it('should soft-delete a document', async () => {
      prisma.document.findUnique.mockResolvedValue(mockDoc);
      prisma.document.update.mockResolvedValue({ ...mockDoc, deletedAt: new Date() });

      await expect(service.remove('doc-1')).resolves.toBeUndefined();
    });

    it('should throw if not found', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid')).rejects.toThrow('Document not found');
    });
  });
});
