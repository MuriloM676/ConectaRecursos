import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from '../alerts.service';
import { PrismaService } from '@modules/prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: any;

  const mockAlert = {
    id: 'alert-1',
    tenantId: 'tenant-1',
    type: 'IMPEDIMENT_IDENTIFIED',
    title: 'Impedimento identificado',
    description: 'Emenda X possui impedimento',
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      alert: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      getTenantId: jest.fn().mockReturnValue('tenant-1'),
      applyTenantFilter: jest.fn((_model, where) => where || {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  describe('create', () => {
    it('should create an alert with recipients', async () => {
      prisma.alert.create.mockResolvedValue(mockAlert);

      const result = await service.create({
        type: 'IMPEDIMENT_IDENTIFIED',
        title: 'Impedimento identificado',
        description: 'Emenda X possui impedimento',
        recipientIds: ['user-1', 'user-2'],
      });

      expect(result.id).toBe('alert-1');
      expect(prisma.alert.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'IMPEDIMENT_IDENTIFIED',
            recipients: expect.objectContaining({
              create: expect.arrayContaining([
                { userId: 'user-1' },
                { userId: 'user-2' },
              ]),
            }),
          }),
        }),
      );
    });

    it('should throw if tenant context is missing', async () => {
      prisma.getTenantId.mockReturnValue(null);

      await expect(
        service.create({
          type: 'SYNC_FAILURE',
          title: 'Test',
          recipientIds: ['user-1'],
        }),
      ).rejects.toThrow('Tenant context missing');
    });
  });

  describe('findAll', () => {
    it('should return paginated alerts', async () => {
      prisma.alert.findMany.mockResolvedValue([mockAlert]);
      prisma.alert.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by type', async () => {
      prisma.alert.findMany.mockResolvedValue([mockAlert]);
      prisma.alert.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 20, type: 'IMPEDIMENT_IDENTIFIED' });
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'IMPEDIMENT_IDENTIFIED' }),
        }),
      );
    });
  });

  describe('findUnread', () => {
    it('should return only unread alerts', async () => {
      prisma.alert.findMany.mockResolvedValue([mockAlert]);

      const result = await service.findUnread();
      expect(result).toHaveLength(1);
      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ read: false }),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      prisma.alert.findUnique.mockResolvedValue(mockAlert);
      prisma.alert.update.mockResolvedValue({ ...mockAlert, read: true });

      const result = await service.markAsRead('alert-1');
      expect(result.read).toBe(true);
    });

    it('should throw if not found', async () => {
      prisma.alert.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('invalid')).rejects.toThrow('Alert not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all alerts as read', async () => {
      prisma.alert.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead();
      expect(result.count).toBe(3);
    });
  });

  describe('createTestAlert', () => {
    it('should create a test alert', async () => {
      prisma.alert.create.mockResolvedValue({
        ...mockAlert,
        type: 'SYNC_FAILURE',
        title: 'Alerta de Teste',
        description: 'Este é um alerta de teste gerado pelo sistema.',
      });

      const result = await service.createTestAlert('user-1');
      expect(result.type).toBe('SYNC_FAILURE');
      expect(result.title).toBe('Alerta de Teste');
    });
  });
});
