export enum Permission {
  // Auth
  AUTH_LOGIN = 'auth:login',
  AUTH_REFRESH = 'auth:refresh',

  // Tenants
  TENANT_CREATE = 'tenant:create',
  TENANT_READ = 'tenant:read',
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',

  // Users
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Roles
  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',

  // Emendas
  EMENDA_CREATE = 'emenda:create',
  EMENDA_READ = 'emenda:read',
  EMENDA_UPDATE = 'emenda:update',
  EMENDA_DELETE = 'emenda:delete',
  EMENDA_HISTORY = 'emenda:history',

  // Parliamentarians
  PARLIAMENTARIAN_CREATE = 'parliamentarian:create',
  PARLIAMENTARIAN_READ = 'parliamentarian:read',
  PARLIAMENTARIAN_UPDATE = 'parliamentarian:update',
  PARLIAMENTARIAN_DELETE = 'parliamentarian:delete',

  // SIOP
  SIOP_SYNC = 'siop:sync',
  SIOP_READ = 'siop:read',
  SIOP_REPROCESS = 'siop:reprocess',

  // Impediments
  IMPEDIMENT_CREATE = 'impediment:create',
  IMPEDIMENT_READ = 'impediment:read',
  IMPEDIMENT_UPDATE = 'impediment:update',
  IMPEDIMENT_DELETE = 'impediment:delete',

  // Convênios
  CONVENIO_CREATE = 'convenio:create',
  CONVENIO_READ = 'convenio:read',
  CONVENIO_UPDATE = 'convenio:update',
  CONVENIO_DELETE = 'convenio:delete',

  // Financial Schedule
  FINANCIAL_SCHEDULE_CREATE = 'financial_schedule:create',
  FINANCIAL_SCHEDULE_READ = 'financial_schedule:read',
  FINANCIAL_SCHEDULE_UPDATE = 'financial_schedule:update',

  // Physical Execution
  PHYSICAL_EXECUTION_CREATE = 'physical_execution:create',
  PHYSICAL_EXECUTION_READ = 'physical_execution:read',
  PHYSICAL_EXECUTION_UPDATE = 'physical_execution:update',

  // Accountability
  ACCOUNTABILITY_CREATE = 'accountability:create',
  ACCOUNTABILITY_READ = 'accountability:read',
  ACCOUNTABILITY_UPDATE = 'accountability:update',
  ACCOUNTABILITY_APPROVE = 'accountability:approve',
  ACCOUNTABILITY_REJECT = 'accountability:reject',

  // Documents
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_DELETE = 'document:delete',

  // Alerts
  ALERT_READ = 'alert:read',
  ALERT_MANAGE = 'alert:manage',

  // Dashboard
  DASHBOARD_READ = 'dashboard:read',

  // Reports
  REPORT_GENERATE = 'report:generate',
  REPORT_READ = 'report:read',

  // Audit Logs
  AUDIT_LOG_READ = 'audit_log:read',

  // Integrations
  INTEGRATION_CREATE = 'integration:create',
  INTEGRATION_READ = 'integration:read',
  INTEGRATION_UPDATE = 'integration:update',
  INTEGRATION_DELETE = 'integration:delete',

  // Public API
  PUBLIC_API_ACCESS = 'public_api:access',
}

/**
 * Default permissions per role.
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN_MUNICIPAL: [
    Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE, Permission.USER_DELETE,
    Permission.EMENDA_CREATE, Permission.EMENDA_READ, Permission.EMENDA_UPDATE, Permission.EMENDA_DELETE, Permission.EMENDA_HISTORY,
    Permission.PARLIAMENTARIAN_READ,
    Permission.SIOP_SYNC, Permission.SIOP_READ, Permission.SIOP_REPROCESS,
    Permission.IMPEDIMENT_CREATE, Permission.IMPEDIMENT_READ, Permission.IMPEDIMENT_UPDATE, Permission.IMPEDIMENT_DELETE,
    Permission.CONVENIO_CREATE, Permission.CONVENIO_READ, Permission.CONVENIO_UPDATE, Permission.CONVENIO_DELETE,
    Permission.FINANCIAL_SCHEDULE_CREATE, Permission.FINANCIAL_SCHEDULE_READ, Permission.FINANCIAL_SCHEDULE_UPDATE,
    Permission.PHYSICAL_EXECUTION_CREATE, Permission.PHYSICAL_EXECUTION_READ, Permission.PHYSICAL_EXECUTION_UPDATE,
    Permission.ACCOUNTABILITY_CREATE, Permission.ACCOUNTABILITY_READ, Permission.ACCOUNTABILITY_UPDATE, Permission.ACCOUNTABILITY_APPROVE, Permission.ACCOUNTABILITY_REJECT,
    Permission.DOCUMENT_UPLOAD, Permission.DOCUMENT_READ, Permission.DOCUMENT_DELETE,
    Permission.ALERT_READ, Permission.ALERT_MANAGE,
    Permission.DASHBOARD_READ,
    Permission.REPORT_GENERATE, Permission.REPORT_READ,
    Permission.AUDIT_LOG_READ,
    Permission.INTEGRATION_CREATE, Permission.INTEGRATION_READ, Permission.INTEGRATION_UPDATE, Permission.INTEGRATION_DELETE,
  ],
  GESTOR: [
    Permission.USER_READ,
    Permission.EMENDA_READ, Permission.EMENDA_UPDATE, Permission.EMENDA_HISTORY,
    Permission.PARLIAMENTARIAN_READ,
    Permission.SIOP_READ,
    Permission.IMPEDIMENT_READ, Permission.IMPEDIMENT_UPDATE,
    Permission.CONVENIO_READ, Permission.CONVENIO_UPDATE,
    Permission.FINANCIAL_SCHEDULE_READ, Permission.FINANCIAL_SCHEDULE_UPDATE,
    Permission.PHYSICAL_EXECUTION_READ, Permission.PHYSICAL_EXECUTION_UPDATE,
    Permission.ACCOUNTABILITY_READ, Permission.ACCOUNTABILITY_UPDATE,
    Permission.DOCUMENT_UPLOAD, Permission.DOCUMENT_READ,
    Permission.ALERT_READ,
    Permission.DASHBOARD_READ,
    Permission.REPORT_GENERATE, Permission.REPORT_READ,
  ],
  OPERADOR: [
    Permission.EMENDA_READ,
    Permission.IMPEDIMENT_READ,
    Permission.CONVENIO_READ,
    Permission.FINANCIAL_SCHEDULE_READ,
    Permission.PHYSICAL_EXECUTION_READ, Permission.PHYSICAL_EXECUTION_UPDATE,
    Permission.ACCOUNTABILITY_READ,
    Permission.DOCUMENT_UPLOAD, Permission.DOCUMENT_READ,
    Permission.ALERT_READ,
    Permission.DASHBOARD_READ,
  ],
  VISUALIZADOR: [
    Permission.EMENDA_READ,
    Permission.IMPEDIMENT_READ,
    Permission.CONVENIO_READ,
    Permission.FINANCIAL_SCHEDULE_READ,
    Permission.PHYSICAL_EXECUTION_READ,
    Permission.ACCOUNTABILITY_READ,
    Permission.DOCUMENT_READ,
    Permission.ALERT_READ,
    Permission.DASHBOARD_READ,
  ],
};
