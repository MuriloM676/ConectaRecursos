import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsService } from '../workflows.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let prisma: any;

  const mockWorkflow = {
    id: 'wf-1',
    tenantId: 'tenant-1',
    name: 'Fluxo Teste',
    createdAt: new Date(),
  };

  const mockStep = {
    id: 'step-1',
    workflowId: 'wf-1',
    stepOrder: 1,
    approverRole: 'GESTOR',
  };

  const mockApproval = {
    id: 'approval-1',
    workflowId: 'wf-1',
    entityType: 'ACCOUNTABILITY_REPORT',
    entityId: 'report-1',
    status: 'PENDING',
    approvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      approvalWorkflow: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      approvalStep: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      approval: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      getTenantId: jest.fn().mockReturnValue('tenant-1'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      prisma.approvalWorkflow.create.mockResolvedValue(mockWorkflow);

      const result = await service.create({ name: 'Fluxo Teste' });
      expect(result.id).toBe('wf-1');
      expect(result.name).toBe('Fluxo Teste');
    });
  });

  describe('findAll', () => {
    it('should return all workflows for tenant', async () => {
      prisma.approvalWorkflow.findMany.mockResolvedValue([mockWorkflow]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Fluxo Teste');
    });
  });

  describe('addStep', () => {
    it('should add a step to a workflow', async () => {
      prisma.approvalWorkflow.findUnique.mockResolvedValue(mockWorkflow);
      prisma.approvalStep.create.mockResolvedValue(mockStep);

      const result = await service.addStep('wf-1', { stepOrder: 1, approverRole: 'GESTOR' });
      expect(result.stepOrder).toBe(1);
      expect(result.approverRole).toBe('GESTOR');
    });

    it('should throw if workflow not found', async () => {
      prisma.approvalWorkflow.findUnique.mockResolvedValue(null);

      await expect(service.addStep('invalid', { stepOrder: 1, approverRole: 'GESTOR' })).rejects.toThrow('Workflow not found');
    });
  });

  describe('getSteps', () => {
    it('should return steps for a workflow', async () => {
      prisma.approvalWorkflow.findUnique.mockResolvedValue(mockWorkflow);
      prisma.approvalStep.findMany.mockResolvedValue([mockStep]);

      const result = await service.getSteps('wf-1');
      expect(result).toHaveLength(1);
      expect(result[0].approverRole).toBe('GESTOR');
    });
  });

  describe('approveApproval', () => {
    it('should approve a pending approval', async () => {
      prisma.approval.findUnique.mockResolvedValue(mockApproval);
      prisma.approval.update.mockResolvedValue({ ...mockApproval, status: 'APPROVED', approvedBy: 'user-1' });

      const result = await service.approveApproval('approval-1', 'user-1');
      expect(result.status).toBe('APPROVED');
      expect(result.approvedBy).toBe('user-1');
    });

    it('should throw if not PENDING', async () => {
      prisma.approval.findUnique.mockResolvedValue({ ...mockApproval, status: 'APPROVED' });

      await expect(service.approveApproval('approval-1')).rejects.toThrow('Approval is not PENDING');
    });
  });

  describe('rejectApproval', () => {
    it('should reject a pending approval', async () => {
      prisma.approval.findUnique.mockResolvedValue(mockApproval);
      prisma.approval.update.mockResolvedValue({ ...mockApproval, status: 'REJECTED', approvedBy: 'user-1' });

      const result = await service.rejectApproval('approval-1', 'user-1');
      expect(result.status).toBe('REJECTED');
    });

    it('should throw if not PENDING', async () => {
      prisma.approval.findUnique.mockResolvedValue({ ...mockApproval, status: 'REJECTED' });

      await expect(service.rejectApproval('approval-1')).rejects.toThrow('Approval is not PENDING');
    });
  });
});
