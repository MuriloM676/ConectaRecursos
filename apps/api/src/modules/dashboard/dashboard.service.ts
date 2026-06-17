import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { EmendaByStatusDto } from './dto/emenda-by-status.dto';
import { ParliamentarianSummaryDto } from './dto/parliamentarian-summary.dto';
import { AreaSummaryDto } from './dto/area-summary.dto';
import { FinancialSummaryDto, MonthlyFinancialDto } from './dto/financial-summary.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<DashboardOverviewDto> {
    const tenantId = this.prisma.getTenantId();

    const tenantFilter = tenantId ? { tenantId } : {};
    const tenantFilterConvenio = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };

    const [emendaAgg, convenioActive, impedimentOpen, scheduleAgg, progressAgg] = await Promise.all([
      this.prisma.emenda.aggregate({
        where: { ...tenantFilter, deletedAt: null },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.convenio.count({
        where: { ...tenantFilterConvenio, status: { not: 'CANCELLED' } },
      }),
      this.prisma.impediment.count({
        where: { ...tenantFilter, status: 'OPEN' },
      }),
      this.prisma.convenioFinancialSchedule.aggregate({
        where: { convenio: { ...tenantFilterConvenio } },
        _sum: { receivedAmount: true },
      }),
      this.prisma.projectStage.aggregate({
        where: { convenio: { ...tenantFilterConvenio } },
        _avg: { actualPercentage: true },
      }),
    ]);

    const capturedAmount = Number(emendaAgg._sum.amount) || 0;
    const receivedAmount = Number(scheduleAgg._sum.receivedAmount) || 0;
    const avgProgress = Number(progressAgg._avg.actualPercentage) || 0;

    const executedAmount = Math.round((capturedAmount * avgProgress) / 100);
    const executionPercentage = capturedAmount > 0 ? Math.round((executedAmount / capturedAmount) * 100) : 0;
    const receivedPercentage = capturedAmount > 0 ? Math.round((receivedAmount / capturedAmount) * 100) : 0;

    return {
      capturedAmount,
      receivedAmount,
      executedAmount,
      totalEmendas: emendaAgg._count,
      activeConvenios: convenioActive,
      openImpediments: impedimentOpen,
      executionPercentage,
      receivedPercentage,
    };
  }

  async getEmendasByStatus(): Promise<EmendaByStatusDto[]> {
    const tenantId = this.prisma.getTenantId();
    const where = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };

    const emendas = await this.prisma.emenda.findMany({
      where,
      select: { status: true, amount: true },
    });

    const grouped = new Map<string, { count: number; totalAmount: number }>();

    for (const emenda of emendas) {
      const current = grouped.get(emenda.status) || { count: 0, totalAmount: 0 };
      current.count++;
      current.totalAmount += Number(emenda.amount);
      grouped.set(emenda.status, current);
    }

    return Array.from(grouped.entries())
      .map(([status, data]) => ({
        status,
        count: data.count,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getParliamentarians(limit = 10): Promise<ParliamentarianSummaryDto[]> {
    const tenantId = this.prisma.getTenantId();
    const where = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };

    const emendas = await this.prisma.emenda.findMany({
      where,
      include: { parliamentarian: true },
    });

    const grouped = new Map<string, { id: string; name: string; party: string; state: string; count: number; totalAmount: number }>();

    for (const emenda of emendas) {
      const p = emenda.parliamentarian;
      const current = grouped.get(p.id) || {
        id: p.id,
        name: p.name,
        party: p.party,
        state: p.state,
        count: 0,
        totalAmount: 0,
      };
      current.count++;
      current.totalAmount += Number(emenda.amount);
      grouped.set(p.id, current);
    }

    return Array.from(grouped.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, limit)
      .map((p) => ({
        id: p.id,
        name: p.name,
        party: p.party,
        state: p.state,
        emendaCount: p.count,
        totalAmount: Math.round(p.totalAmount * 100) / 100,
      }));
  }

  async getAreas(): Promise<AreaSummaryDto[]> {
    const tenantId = this.prisma.getTenantId();
    const where = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };

    const emendas = await this.prisma.emenda.findMany({
      where,
      select: { type: true, amount: true },
    });

    const grouped = new Map<string, { count: number; totalAmount: number }>();

    for (const emenda of emendas) {
      const current = grouped.get(emenda.type) || { count: 0, totalAmount: 0 };
      current.count++;
      current.totalAmount += Number(emenda.amount);
      grouped.set(emenda.type, current);
    }

    return Array.from(grouped.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        totalAmount: Math.round(data.totalAmount * 100) / 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  async getFinancial(): Promise<FinancialSummaryDto> {
    const tenantId = this.prisma.getTenantId();

    const whereConvenio = tenantId ? { tenantId, deletedAt: null } : { deletedAt: null };

    const schedules = await this.prisma.convenioFinancialSchedule.findMany({
      where: { convenio: whereConvenio },
      select: {
        expectedAmount: true,
        expectedDate: true,
        receivedAmount: true,
      },
    });

    let totalExpected = 0;
    let totalReceived = 0;
    const monthlyMap = new Map<string, MonthlyFinancialDto>();

    for (const s of schedules) {
      const date = new Date(s.expectedDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const expected = Number(s.expectedAmount);
      const received = Number(s.receivedAmount) || 0;

      totalExpected += expected;
      totalReceived += received;

      const existing = monthlyMap.get(key) || { month, year, expectedAmount: 0, receivedAmount: 0 };
      existing.expectedAmount += expected;
      existing.receivedAmount += received;
      monthlyMap.set(key, existing);
    }

    const monthlyBreakdown = Array.from(monthlyMap.values())
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((m) => ({
        ...m,
        expectedAmount: Math.round(m.expectedAmount * 100) / 100,
        receivedAmount: Math.round(m.receivedAmount * 100) / 100,
      }));

    return {
      totalExpected: Math.round(totalExpected * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      balance: Math.round((totalReceived - totalExpected) * 100) / 100,
      monthlyBreakdown,
    };
  }
}
