import { Test, TestingModule } from '@nestjs/testing';
import { SiopService } from './siop.service';
import { SiopClientService } from './siop-client.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('SiopService', () => {
  let service: SiopService;
  let prisma: PrismaService;
  let siopClient: SiopClientService;

  const mockSiopEmenda = {
    codigoEmenda: '20260001',
    ano: 2026,
    autor: { nome: 'João Silva', partido: 'PT', uf: 'SP' },
    valorAtual: 1000000,
    objeto: 'Construção de UBS',
    tipoEmenda: 'INDIVIDUAL',
    situacao: 'PENDING',
    beneficiarios: [{ nome: 'Prefeitura de Avaré', cnpj: '00.000.000/0001-91', valor: 1000000 }],
    impedimentos: [],
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', document: '00000000000191' }),
    },
    syncJob: {
      create: jest.fn().mockResolvedValue({ id: 'job-1' }),
      update: jest.fn(),
    },
    parliamentarian: {
      upsert: jest.fn().mockResolvedValue({ id: 'p-1' }),
    },
    emenda: {
      upsert: jest.fn().mockResolvedValue({ id: 'e-1' }),
    },
    beneficiary: {
      upsert: jest.fn(),
    },
    impediment: {
      upsert: jest.fn(),
    },
  };

  const mockSiopClient = {
    query: jest.fn().mockResolvedValue({ emendas: [mockSiopEmenda] }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiopService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SiopClientService, useValue: mockSiopClient },
      ],
    }).compile();

    service = module.get<SiopService>(SiopService);
    prisma = module.get<PrismaService>(PrismaService);
    siopClient = module.get<SiopClientService>(SiopClientService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncEmendas', () => {
    it('should perform full sync successfully', async () => {
      const result = await service.syncEmendas('tenant-1');

      expect(result.processed).toBe(1);
      expect(result.errors).toBe(0);
      expect(mockSiopClient.query).toHaveBeenCalled();
      expect(mockPrisma.emenda.upsert).toHaveBeenCalled();
      expect(mockPrisma.syncJob.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'job-1' },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      }));
    });

    it('should handle SIOP client errors', async () => {
      mockSiopClient.query.mockRejectedValue(new Error('API Down'));

      await expect(service.syncEmendas('tenant-1')).rejects.toThrow('API Down');
      expect(mockPrisma.syncJob.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      }));
    });
  });
});
