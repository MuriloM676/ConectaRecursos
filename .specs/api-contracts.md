# api-contracts.md

# CaptaGov - API Contracts

## Padrões

### Base URL

```http
/api/v1
```

### Content-Type

```http
application/json
```

### Authentication

```http
Authorization: Bearer <token>
```

### Response Pattern

Success

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-06-15T12:00:00Z"
}
```

Error

```json
{
  "success": false,
  "message": "Validation error",
  "errors": []
}
```

---

# AUTH MODULE

## POST /auth/login

### Request

```json
{
  "email": "user@captagov.com",
  "password": "123456"
}
```

### Response

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "expiresIn": 3600
}
```

---

## POST /auth/refresh

### Request

```json
{
  "refreshToken": "jwt"
}
```

### Response

```json
{
  "accessToken": "jwt"
}
```

---

## POST /auth/forgot-password

### Request

```json
{
  "email": "user@captagov.com"
}
```

---

## POST /auth/reset-password

### Request

```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

---

# USERS

## GET /users

### Query

```http
?page=1
&limit=20
```

---

## POST /users

### Request

```json
{
  "name": "Murilo Martins",
  "email": "murilo@email.com",
  "roleId": "uuid"
}
```

---

## GET /users/:id

---

## PATCH /users/:id

---

## DELETE /users/:id

Soft Delete

---

# TENANTS

## GET /tenants

---

## POST /tenants

### Request

```json
{
  "name": "Prefeitura de Avaré",
  "document": "000000000001"
}
```

---

## GET /tenants/:id

---

## PATCH /tenants/:id

---

# PARLIAMENTARIANS

## GET /parliamentarians

### Filters

```http
?name=
?party=
?state=
```

---

## POST /parliamentarians

### Request

```json
{
  "name": "Deputado X",
  "party": "ABC",
  "state": "SP"
}
```

---

# EMENDAS

## GET /emendas

### Filters

```http
?year=
?status=
?parliamentarianId=
?tenantId=
```

### Response

```json
{
  "items": [],
  "total": 0
}
```

---

## POST /emendas

### Request

```json
{
  "year": 2026,
  "number": "20260001",
  "parliamentarianId": "uuid",
  "amount": 1000000,
  "object": "Construção de UBS"
}
```

---

## GET /emendas/:id

---

## PATCH /emendas/:id

---

## DELETE /emendas/:id

Soft Delete

---

## GET /emendas/:id/history

### Response

```json
[
  {
    "field": "status",
    "oldValue": "PENDING",
    "newValue": "APPROVED"
  }
]
```

---

# BENEFICIÁRIOS

## GET /beneficiaries

---

## POST /beneficiaries

### Request

```json
{
  "emendaId": "uuid",
  "name": "Prefeitura de Avaré",
  "amount": 500000
}
```

---

# CONVÊNIOS

## GET /convenios

### Filters

```http
?status=
?year=
```

---

## POST /convenios

### Request

```json
{
  "emendaId": "uuid",
  "number": "CV-2026-001",
  "object": "Construção de UBS",
  "totalAmount": 2500000,
  "counterpartAmount": 200000
}
```

---

## GET /convenios/:id

---

## PATCH /convenios/:id

---

## DELETE /convenios/:id

---

# CRONOGRAMA FINANCEIRO

## GET /convenios/:id/schedule

---

## POST /convenios/:id/schedule

### Request

```json
{
  "expectedAmount": 500000,
  "expectedDate": "2026-09-01"
}
```

---

## PATCH /schedule/:id

---

# EXECUÇÃO FÍSICA

## GET /convenios/:id/progress

---

## POST /convenios/:id/progress

### Request

```json
{
  "percentage": 25,
  "notes": "Fundação concluída"
}
```

---

# IMPEDIMENTOS

## GET /impediments

### Filters

```http
?status=
?emendaId=
```

---

## POST /impediments

### Request

```json
{
  "emendaId": "uuid",
  "description": "Documentação pendente"
}
```

---

## PATCH /impediments/:id

---

## GET /impediments/:id/history

---

# PRESTAÇÃO DE CONTAS

## GET /accountability-reports

---

## POST /accountability-reports

### Request

```json
{
  "convenioId": "uuid",
  "notes": "Prestação referente ao período"
}
```

---

## PATCH /accountability-reports/:id

---

## POST /accountability-reports/:id/submit

---

## POST /accountability-reports/:id/approve

---

## POST /accountability-reports/:id/reject

---

# WORKFLOW

## GET /workflows

---

## POST /workflows

### Request

```json
{
  "name": "Fluxo Prestação de Contas"
}
```

---

## POST /workflows/:id/steps

---

## POST /approvals/:id/approve

---

## POST /approvals/:id/reject

---

# DOCUMENTOS

## POST /documents/upload

Multipart

### Response

```json
{
  "id": "uuid",
  "fileName": "arquivo.pdf"
}
```

---

## GET /documents

---

## GET /documents/:id

---

## DELETE /documents/:id

Soft Delete

---

# ALERTAS

## GET /alerts

---

## GET /alerts/unread

---

## PATCH /alerts/:id/read

---

## POST /alerts/test

---

# DASHBOARD

## GET /dashboard/overview

### Response

```json
{
  "capturedAmount": 10000000,
  "receivedAmount": 7000000,
  "executedAmount": 5000000
}
```

---

## GET /dashboard/emendas

---

## GET /dashboard/parliamentarians

---

## GET /dashboard/areas

---

## GET /dashboard/financial

---

# RELATÓRIOS

## POST /reports/generate

### Request

```json
{
  "type": "EMENDAS",
  "format": "PDF"
}
```

---

## GET /reports

---

## GET /reports/:id/download

---

# INTEGRAÇÕES

## GET /integrations

---

## POST /integrations

### Request

```json
{
  "provider": "SIOP",
  "active": true
}
```

---

## GET /integrations/:id/logs

---

## POST /integrations/:id/test

---

# SIOP

## POST /siop/sync

Dispara sincronização manual

### Response

```json
{
  "jobId": "uuid"
}
```

---

## GET /siop/jobs

---

## GET /siop/jobs/:id

---

## GET /siop/sync-status

---

## POST /siop/reprocess/:jobId

---

# AUDITORIA

## GET /audit-logs

### Filters

```http
?entity=
?user=
?startDate=
?endDate=
```

---

# HEALTH

## GET /health

### Response

```json
{
  "api": "UP",
  "database": "UP",
  "redis": "UP",
  "rabbitmq": "UP"
}
```

---

# API PÚBLICA

## GET /public/emendas

API Key Required

---

## GET /public/convenios

API Key Required

---

## GET /public/indicators

API Key Required

---

# WEBHOOKS

## POST /webhooks/register

### Request

```json
{
  "url": "https://cliente.com/webhook",
  "events": [
    "EMENDA_CREATED",
    "IMPEDIMENT_CREATED"
  ]
}
```

---

# RATE LIMIT

Default

```text
100 requests/minute
```

Public API

```text
30 requests/minute
```

---

# Swagger Requirements

Todos os endpoints devem possuir:

* Swagger Tags
* Swagger Operation
* Swagger Response
* Swagger Example
* DTOs documentados
* Validation Pipes
* OpenAPI 3.1

---

# Estimativa

Módulos: 18

Endpoints: ~95

DTOs: ~150

Swagger Coverage: 100%

Testes E2E: 100%
