/**
 * Interface for entities that belong to a tenant.
 * All multi-tenant entities must implement this interface.
 */
export interface TenantAware {
  tenantId: string;
}
