import { Test, TestingModule } from '@nestjs/testing';
import { Job, Queue } from 'bullmq';
import { SiopProcessor } from './siop.processor';
import { SiopService } from './services/siop.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('SiopProcessor', () => {
  let processor: SiopProcessor;
  let siopService: SiopService;
  let dlq: Queue;

  const mockSiopService = {
    syncEmendas: jest.fn(),
  };

  const mockDlq = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiopProcessor,
        { provide: SiopService, useValue: mockSiopService },
        { provide: getQueueToken('siop-sync-dlq'), useValue: mockDlq },
      ],
    }).compile();

    processor = module.get<SiopProcessor>(SiopProcessor);
    siopService = module.get<SiopService>(SiopService);
    dlq = module.get<Queue>(getQueueToken('siop-sync-dlq'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const mockJob = {
      id: 'job-123',
      data: { tenantId: 'tenant-1' },
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as Job<any, any, string>;

    it('should process SIOP sync job successfully', async () => {
      mockSiopService.syncEmendas.mockResolvedValue({ processed: 5, errors: 0 });

      const result = await processor.process(mockJob);

      expect(result).toEqual({ processed: 5, errors: 0 });
      expect(mockSiopService.syncEmendas).toHaveBeenCalledWith('tenant-1');
    });

    it('should rethrow error on failure and not move to DLQ if retries remain', async () => {
      const jobWithRetries = {
        ...mockJob,
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as Job<any, any, string>;

      mockSiopService.syncEmendas.mockRejectedValue(new Error('API Error'));

      await expect(processor.process(jobWithRetries)).rejects.toThrow('API Error');
      expect(mockDlq.add).not.toHaveBeenCalled();
    });

    it('should move failed job to DLQ when all retries are exhausted', async () => {
      const lastAttemptJob = {
        ...mockJob,
        attemptsMade: 2,
        opts: { attempts: 3 },
      } as Job<any, any, string>;

      mockSiopService.syncEmendas.mockRejectedValue(new Error('Final error'));

      await expect(processor.process(lastAttemptJob)).rejects.toThrow('Final error');

      expect(mockDlq.add).toHaveBeenCalledWith(
        'sync-failed',
        expect.objectContaining({
          originalJobId: 'job-123',
          tenantId: 'tenant-1',
          errorMessage: 'Final error',
        }),
      );
    });
  });
});
