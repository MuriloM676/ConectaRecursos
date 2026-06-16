import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Models that have tenantId column for automatic tenant filtering.
 * Add new tenant-scoped models here as they are created.
 */
const TENANT_SCOPED_MODELS = [
  'user',
  'emenda',
  'convenio',
  'document',
  'alert',
  'integration',
  'auditlog',
  'generatedreport',
  'approvalworkflow',
  'dashboardmetric',
] as const;

type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private currentTenantId: string | null = null;

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Set the tenant context for automatic filtering.
   */
  setTenantId(tenantId: string | null): void {
    this.currentTenantId = tenantId;
  }

  /**
   * Get the current tenant context.
   */
  getTenantId(): string | null {
    return this.currentTenantId;
  }

  /**
   * Clear the tenant context.
   */
  clearTenantId(): void {
    this.currentTenantId = null;
  }

  /**
   * Apply tenant filter to where clause for tenant-scoped models.
   * Returns the modified where clause with tenantId filter.
   */
  applyTenantFilter<T extends Record<string, any>>(
    model: string,
    where?: T,
  ): T | undefined {
    if (!this.currentTenantId) return where;

    const modelName = model.toLowerCase();
    const isScoped = TENANT_SCOPED_MODELS.includes(
      modelName as TenantScopedModel,
    );

    if (!isScoped) return where;

    // Don't override an explicit tenantId filter
    if (where && 'tenantId' in where && where.tenantId !== undefined) {
      return where;
    }

    return {
      ...(where || {}),
      tenantId: this.currentTenantId,
    } as unknown as T;
  }
}
