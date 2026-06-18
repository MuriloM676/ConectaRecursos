import { Test, TestingModule } from '@nestjs/testing';
import { PhysicalExecutionService } from '../physical-execution.service';
import { PrismaService } from '@modules/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PhysicalExecutionService', () => {
  let service: PhysicalExecutionService;

  const mockStage = {
    id: 'stage-1',
    convenioId: 'convenio-1',
    name: 'Fundação',
    plannedPercentage: 25,
    actualPercentage: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: [],
  };

  const mockProgress = {
    id: 'progress-1',
    stageId: 'stage-1',
    percentage: 25,
    notes: 'Fundação concluída',
    createdBy: 'user-1',
    createdAt: new Date(),
    stage: { name: 'Fundação' },
  };

  const mockPrisma = {
    convenio: {
      findUnique: jest.fn(),
    },
    projectStage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    projectProgress: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalExecutionService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PhysicalExecutionService>(PhysicalExecutionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createStage', () => {
    it('should create a stage successfully', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue({ id: 'convenio-1' });
      mockPrisma.projectStage.create.mockResolvedValue(mockStage);

      const result = await service.createStage('convenio-1', {
        name: 'Fundação',
        plannedPercentage: 25,
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Fundação');
      expect(result.plannedPercentage).toBe(25);
    });

    it('should throw NotFoundException for invalid convenio', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue(null);

      await expect(
        service.createStage('invalid-id', { name: 'Test', plannedPercentage: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStages', () => {
    it('should return stages for a valid convenio', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue({ id: 'convenio-1' });
      mockPrisma.projectStage.findMany.mockResolvedValue([mockStage]);

      const result = await service.getStages('convenio-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fundação');
    });
  });

  describe('updateStage', () => {
    it('should update a stage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(mockStage);
      mockPrisma.projectStage.update.mockResolvedValue({
        ...mockStage,
        name: 'Superestrutura',
      });

      const result = await service.updateStage('stage-1', { name: 'Superestrutura' });

      expect(result.name).toBe('Superestrutura');
    });

    it('should throw NotFoundException for invalid stage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(null);

      await expect(service.updateStage('invalid-id', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteStage', () => {
    it('should delete a stage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(mockStage);

      await expect(service.deleteStage('stage-1')).resolves.not.toThrow();
    });

    it('should throw NotFoundException for invalid stage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(null);

      await expect(service.deleteStage('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordProgress', () => {
    it('should record progress and update stage actualPercentage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(mockStage);
      mockPrisma.projectProgress.create.mockResolvedValue(mockProgress);

      const result = await service.recordProgress({
        stageId: 'stage-1',
        percentage: 25,
        notes: 'Fundação concluída',
      });

      expect(result).toBeDefined();
      expect(result.percentage).toBe(25);
      expect(result.stageName).toBe('Fundação');
    });

    it('should throw NotFoundException for invalid stage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(null);

      await expect(
        service.recordProgress({ stageId: 'invalid-id', percentage: 25 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProgressHistory', () => {
    it('should return progress history for a stage', async () => {
      mockPrisma.projectStage.findUnique.mockResolvedValue(mockStage);
      mockPrisma.projectProgress.findMany.mockResolvedValue([mockProgress]);

      const result = await service.getProgressHistory('stage-1');

      expect(result).toHaveLength(1);
      expect(result[0].percentage).toBe(25);
    });
  });

  describe('getConvenioProgress', () => {
    it('should return aggregated convenio progress', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue({ id: 'convenio-1' });
      mockPrisma.projectStage.findMany.mockResolvedValue([mockStage]);
      mockPrisma.projectProgress.findMany.mockResolvedValue([mockProgress]);

      const result = await service.getConvenioProgress('convenio-1');

      expect(result.convenioId).toBe('convenio-1');
      expect(result.stages).toHaveLength(1);
      expect(result.recentProgress).toHaveLength(1);
      expect(typeof result.overallPercentage).toBe('number');
    });

    it('should throw NotFoundException for invalid convenio', async () => {
      mockPrisma.convenio.findUnique.mockResolvedValue(null);

      await expect(service.getConvenioProgress('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
