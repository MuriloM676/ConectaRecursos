# database-design.md

# CaptaGov - Database Design

## Visão Geral

Modelo SaaS Multi-Tenant para gestão de:

* Emendas Parlamentares
* Convênios
* Impedimentos
* Prestação de Contas
* Documentos
* Alertas
* Dashboard Executivo
* Integrações SIOP

---

# Tenant

## tenants

| Campo      | Tipo      |
| ---------- | --------- |
| id         | uuid      |
| name       | varchar   |
| document   | varchar   |
| city       | varchar   |
| state      | varchar   |
| status     | enum      |
| created_at | timestamp |
| updated_at | timestamp |

Relacionamentos:

```text
Tenant
 ├── Users
 ├── Emendas
 ├── Convênios
 ├── Alertas
 ├── Documentos
 └── Configurações
```

---

# Usuários

## users

| Campo         | Tipo      |
| ------------- | --------- |
| id            | uuid      |
| tenant_id     | uuid      |
| role_id       | uuid      |
| name          | varchar   |
| email         | varchar   |
| password_hash | varchar   |
| active        | boolean   |
| last_login    | timestamp |
| created_at    | timestamp |

---

## roles

| Campo       | Tipo    |
| ----------- | ------- |
| id          | uuid    |
| name        | varchar |
| description | varchar |

Perfis:

```text
SUPER_ADMIN
ADMIN_MUNICIPAL
GESTOR
OPERADOR
VISUALIZADOR
```

---

## permissions

| Campo       | Tipo    |
| ----------- | ------- |
| id          | uuid    |
| code        | varchar |
| description | varchar |

---

## role_permissions

Tabela N:N

```text
roles
 ↔
permissions
```

---

# Emendas

## parliamentarians

| Campo | Tipo    |
| ----- | ------- |
| id    | uuid    |
| name  | varchar |
| party | varchar |
| state | varchar |

---

## emendas

| Campo              | Tipo      |
| ------------------ | --------- |
| id                 | uuid      |
| tenant_id          | uuid      |
| parliamentarian_id | uuid      |
| external_id        | varchar   |
| year               | integer   |
| number             | varchar   |
| type               | varchar   |
| object             | text      |
| amount             | decimal   |
| status             | varchar   |
| source             | varchar   |
| created_at         | timestamp |

Relacionamentos:

```text
Parlamentar
      ↓
Emenda
      ↓
Beneficiário
      ↓
Convênio
```

---

## emenda_history

| Campo      | Tipo      |
| ---------- | --------- |
| id         | uuid      |
| emenda_id  | uuid      |
| field_name | varchar   |
| old_value  | text      |
| new_value  | text      |
| changed_by | uuid      |
| created_at | timestamp |

---

# Beneficiários

## beneficiaries

| Campo     | Tipo    |
| --------- | ------- |
| id        | uuid    |
| emenda_id | uuid    |
| name      | varchar |
| document  | varchar |
| amount    | decimal |

---

# Convênios

## convenios

| Campo              | Tipo    |
| ------------------ | ------- |
| id                 | uuid    |
| tenant_id          | uuid    |
| emenda_id          | uuid    |
| number             | varchar |
| object             | text    |
| total_amount       | decimal |
| counterpart_amount | decimal |
| start_date         | date    |
| end_date           | date    |
| status             | varchar |

---

## convenio_financial_schedule

| Campo           | Tipo    |
| --------------- | ------- |
| id              | uuid    |
| convenio_id     | uuid    |
| expected_amount | decimal |
| expected_date   | date    |
| received_amount | decimal |
| received_date   | date    |
| status          | varchar |

---

# Execução Física

## project_stages

| Campo              | Tipo    |
| ------------------ | ------- |
| id                 | uuid    |
| convenio_id        | uuid    |
| name               | varchar |
| planned_percentage | decimal |
| actual_percentage  | decimal |

---

## project_progress

| Campo      | Tipo      |
| ---------- | --------- |
| id         | uuid      |
| stage_id   | uuid      |
| percentage | decimal   |
| notes      | text      |
| created_by | uuid      |
| created_at | timestamp |

---

# Impedimentos

## impediments

| Campo       | Tipo      |
| ----------- | --------- |
| id          | uuid      |
| emenda_id   | uuid      |
| external_id | varchar   |
| description | text      |
| status      | varchar   |
| opened_at   | timestamp |
| resolved_at | timestamp |

---

## impediment_history

| Campo         | Tipo      |
| ------------- | --------- |
| id            | uuid      |
| impediment_id | uuid      |
| old_status    | varchar   |
| new_status    | varchar   |
| changed_at    | timestamp |

---

# Prestação de Contas

## accountability_reports

| Campo        | Tipo      |
| ------------ | --------- |
| id           | uuid      |
| convenio_id  | uuid      |
| status       | varchar   |
| submitted_at | timestamp |
| approved_at  | timestamp |
| notes        | text      |

---

## accountability_items

| Campo       | Tipo    |
| ----------- | ------- |
| id          | uuid    |
| report_id   | uuid    |
| description | text    |
| amount      | decimal |

---

# Workflow

## approval_workflows

| Campo     | Tipo    |
| --------- | ------- |
| id        | uuid    |
| tenant_id | uuid    |
| name      | varchar |

---

## approval_steps

| Campo         | Tipo    |
| ------------- | ------- |
| id            | uuid    |
| workflow_id   | uuid    |
| step_order    | integer |
| approver_role | varchar |

---

## approvals

| Campo       | Tipo    |
| ----------- | ------- |
| id          | uuid    |
| workflow_id | uuid    |
| entity_type | varchar |
| entity_id   | uuid    |
| status      | varchar |
| approved_by | uuid    |

---

# Documentos

## documents

| Campo       | Tipo    |
| ----------- | ------- |
| id          | uuid    |
| tenant_id   | uuid    |
| entity_type | varchar |
| entity_id   | uuid    |
| file_name   | varchar |
| file_path   | varchar |
| mime_type   | varchar |
| version     | integer |
| uploaded_by | uuid    |

---

# Alertas

## alerts

| Campo       | Tipo      |
| ----------- | --------- |
| id          | uuid      |
| tenant_id   | uuid      |
| type        | varchar   |
| title       | varchar   |
| description | text      |
| read        | boolean   |
| created_at  | timestamp |

---

## alert_recipients

| Campo    | Tipo      |
| -------- | --------- |
| id       | uuid      |
| alert_id | uuid      |
| user_id  | uuid      |
| read_at  | timestamp |

---

# Relatórios

## generated_reports

| Campo        | Tipo      |
| ------------ | --------- |
| id           | uuid      |
| tenant_id    | uuid      |
| report_type  | varchar   |
| generated_by | uuid      |
| file_path    | varchar   |
| generated_at | timestamp |

---

# Integrações

## integrations

| Campo       | Tipo    |
| ----------- | ------- |
| id          | uuid    |
| tenant_id   | uuid    |
| provider    | varchar |
| active      | boolean |
| config_json | jsonb   |

---

## integration_logs

| Campo            | Tipo      |
| ---------------- | --------- |
| id               | uuid      |
| integration_id   | uuid      |
| status           | varchar   |
| request_payload  | jsonb     |
| response_payload | jsonb     |
| executed_at      | timestamp |

---

# Jobs

## sync_jobs

| Campo             | Tipo      |
| ----------------- | --------- |
| id                | uuid      |
| provider          | varchar   |
| status            | varchar   |
| started_at        | timestamp |
| finished_at       | timestamp |
| records_processed | integer   |

---

# Auditoria

## audit_logs

| Campo       | Tipo      |
| ----------- | --------- |
| id          | uuid      |
| tenant_id   | uuid      |
| user_id     | uuid      |
| entity_type | varchar   |
| entity_id   | uuid      |
| action      | varchar   |
| old_data    | jsonb     |
| new_data    | jsonb     |
| ip_address  | varchar   |
| created_at  | timestamp |

---

# Dashboard Materializado

## dashboard_metrics

| Campo          | Tipo    |
| -------------- | ------- |
| id             | uuid    |
| tenant_id      | uuid    |
| metric_name    | varchar |
| metric_value   | decimal |
| reference_date | date    |

---

# Relacionamentos Principais

```text
Tenant
│
├── Users
├── Emendas
│     ├── Beneficiários
│     ├── Impedimentos
│     └── Convênios
│             ├── Cronograma Financeiro
│             ├── Execução Física
│             ├── Prestação de Contas
│             └── Documentos
│
├── Alertas
├── Integrações
├── Relatórios
└── Auditoria
```

Estimativa:

* 30+ tabelas
* 100+ índices
* Multi-Tenant
* PostgreSQL 16
* Prisma ORM
* Preparado para milhões de registros de sincronização
