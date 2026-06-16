-- ============================================================
-- CaptaGov - Initial Migration
-- ============================================================

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "document" VARCHAR(18) NOT NULL,
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenants_document_key" ON "tenants"("document");

-- CreateTable: roles
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateTable: permissions
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateTable: role_permissions
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateTable: parliamentarians
CREATE TABLE "parliamentarians" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "party" VARCHAR(20) NOT NULL,
    "state" VARCHAR(2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parliamentarians_pkey" PRIMARY KEY ("id")
);

-- CreateTable: emendas
CREATE TABLE "emendas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "parliamentarian_id" UUID NOT NULL,
    "external_id" VARCHAR(100),
    "year" INTEGER NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "type" VARCHAR(30) NOT NULL DEFAULT 'INDIVIDUAL',
    "object" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "source" VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "emendas_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "emendas_tenant_id_idx" ON "emendas"("tenant_id");
CREATE INDEX "emendas_parliamentarian_id_idx" ON "emendas"("parliamentarian_id");
CREATE INDEX "emendas_year_idx" ON "emendas"("year");
CREATE INDEX "emendas_status_idx" ON "emendas"("status");
CREATE INDEX "emendas_external_id_idx" ON "emendas"("external_id");

-- CreateTable: emenda_history
CREATE TABLE "emenda_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emenda_id" UUID NOT NULL,
    "field_name" VARCHAR(100) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emenda_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "emenda_history_emenda_id_idx" ON "emenda_history"("emenda_id");

-- CreateTable: beneficiaries
CREATE TABLE "beneficiaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emenda_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "document" VARCHAR(18),
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "beneficiaries_emenda_id_idx" ON "beneficiaries"("emenda_id");

-- CreateTable: convenios
CREATE TABLE "convenios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "emenda_id" UUID NOT NULL,
    "number" VARCHAR(100) NOT NULL,
    "object" TEXT NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "counterpart_amount" DECIMAL(15,2) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "convenios_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "convenios_tenant_id_idx" ON "convenios"("tenant_id");
CREATE INDEX "convenios_emenda_id_idx" ON "convenios"("emenda_id");
CREATE INDEX "convenios_status_idx" ON "convenios"("status");

-- CreateTable: convenio_financial_schedule
CREATE TABLE "convenio_financial_schedule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "convenio_id" UUID NOT NULL,
    "expected_amount" DECIMAL(15,2) NOT NULL,
    "expected_date" DATE NOT NULL,
    "received_amount" DECIMAL(15,2),
    "received_date" DATE,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenio_financial_schedule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "convenio_financial_schedule_convenio_id_idx" ON "convenio_financial_schedule"("convenio_id");

-- CreateTable: project_stages
CREATE TABLE "project_stages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "convenio_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "planned_percentage" DECIMAL(5,2) NOT NULL,
    "actual_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_stages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_stages_convenio_id_idx" ON "project_stages"("convenio_id");

-- CreateTable: project_progress
CREATE TABLE "project_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stage_id" UUID NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_progress_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "project_progress_stage_id_idx" ON "project_progress"("stage_id");

-- CreateTable: impediments
CREATE TABLE "impediments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "emenda_id" UUID NOT NULL,
    "external_id" VARCHAR(100),
    "description" TEXT NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impediments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "impediments_emenda_id_idx" ON "impediments"("emenda_id");
CREATE INDEX "impediments_status_idx" ON "impediments"("status");

-- CreateTable: impediment_history
CREATE TABLE "impediment_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "impediment_id" UUID NOT NULL,
    "old_status" VARCHAR(30),
    "new_status" VARCHAR(30),
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "impediment_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "impediment_history_impediment_id_idx" ON "impediment_history"("impediment_id");

-- CreateTable: accountability_reports
CREATE TABLE "accountability_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "convenio_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accountability_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accountability_reports_convenio_id_idx" ON "accountability_reports"("convenio_id");

-- CreateTable: accountability_items
CREATE TABLE "accountability_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "accountability_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accountability_items_report_id_idx" ON "accountability_items"("report_id");

-- CreateTable: approval_workflows
CREATE TABLE "approval_workflows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable: approval_steps
CREATE TABLE "approval_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflow_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "approver_role" VARCHAR(50) NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "approval_steps_workflow_id_step_order_key" ON "approval_steps"("workflow_id","step_order");

-- CreateTable: approvals
CREATE TABLE "approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workflow_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "approved_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "approvals_entity_type_entity_id_idx" ON "approvals"("entity_type","entity_id");

-- CreateTable: documents
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploaded_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "documents_tenant_id_idx" ON "documents"("tenant_id");
CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type","entity_id");

-- CreateTable: alerts
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "alerts_tenant_id_idx" ON "alerts"("tenant_id");
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateTable: alert_recipients
CREATE TABLE "alert_recipients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alert_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "alert_recipients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "alert_recipients_alert_id_user_id_key" ON "alert_recipients"("alert_id","user_id");

-- CreateTable: generated_reports
CREATE TABLE "generated_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "report_type" VARCHAR(50) NOT NULL,
    "format" VARCHAR(10) NOT NULL DEFAULT 'PDF',
    "generated_by" UUID,
    "file_path" VARCHAR(500),
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "generated_reports_tenant_id_idx" ON "generated_reports"("tenant_id");

-- CreateTable: integrations
CREATE TABLE "integrations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "config_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "integrations_tenant_id_idx" ON "integrations"("tenant_id");

-- CreateTable: integration_logs
CREATE TABLE "integration_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "integration_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "integration_logs_integration_id_idx" ON "integration_logs"("integration_id");

-- CreateTable: sync_jobs
CREATE TABLE "sync_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" VARCHAR(50) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "records_processed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "sync_jobs_status_idx" ON "sync_jobs"("status");

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type","entity_id");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateTable: dashboard_metrics
CREATE TABLE "dashboard_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_value" DECIMAL(15,2) NOT NULL,
    "reference_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_metrics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "dashboard_metrics_tenant_id_metric_name_reference_date_idx" ON "dashboard_metrics"("tenant_id","metric_name","reference_date");

-- ============================================================
-- Foreign Key Constraints
-- ============================================================
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emendas" ADD CONSTRAINT "emendas_parliamentarian_id_fkey" FOREIGN KEY ("parliamentarian_id") REFERENCES "parliamentarians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emenda_history" ADD CONSTRAINT "emenda_history_emenda_id_fkey" FOREIGN KEY ("emenda_id") REFERENCES "emendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_emenda_id_fkey" FOREIGN KEY ("emenda_id") REFERENCES "emendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "convenios" ADD CONSTRAINT "convenios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "convenios" ADD CONSTRAINT "convenios_emenda_id_fkey" FOREIGN KEY ("emenda_id") REFERENCES "emendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "convenio_financial_schedule" ADD CONSTRAINT "cfs_convenio_id_fkey" FOREIGN KEY ("convenio_id") REFERENCES "convenios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_stages" ADD CONSTRAINT "project_stages_convenio_id_fkey" FOREIGN KEY ("convenio_id") REFERENCES "convenios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_progress" ADD CONSTRAINT "project_progress_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "project_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "impediments" ADD CONSTRAINT "impediments_emenda_id_fkey" FOREIGN KEY ("emenda_id") REFERENCES "emendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "impediment_history" ADD CONSTRAINT "impediment_history_impediment_id_fkey" FOREIGN KEY ("impediment_id") REFERENCES "impediments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accountability_reports" ADD CONSTRAINT "accountability_reports_convenio_id_fkey" FOREIGN KEY ("convenio_id") REFERENCES "convenios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accountability_items" ADD CONSTRAINT "accountability_items_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "accountability_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "approval_workflows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "alert_recipients" ADD CONSTRAINT "alert_recipients_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "generated_reports" ADD CONSTRAINT "generated_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
