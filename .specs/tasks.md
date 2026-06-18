# tasks.md

# CaptaGov - Development Roadmap

---

# FASE 01 - FOUNDATION ✅ CONCLUÍDA

## T001 ✅
Criar repositório monorepo

## T002 ✅
Configurar Git Flow

## T003 ✅
Configurar Conventional Commits

## T004 ✅
Configurar Husky

## T005 ✅
Configurar Commitlint

## T006 ✅
Configurar ESLint Backend

## T007 ✅
Configurar ESLint Frontend

## T008 ✅
Configurar Prettier

## T009 ✅
Configurar EditorConfig

## T010 ✅
Criar estrutura Docker Compose

Dependência:

* T001

---

## T011 ✅
Adicionar PostgreSQL

## T012 ✅
Adicionar Redis

## T013 ✅
Adicionar RabbitMQ

## T014 ✅
Adicionar Mailhog

## T015 ✅
Criar rede Docker

## T016 ✅
Criar volumes persistentes

---

## T017 ✅
Criar backend NestJS

## T018 ✅
Criar frontend Next.js

## T019 ✅
Configurar Tailwind

## T020 ✅
Configurar Shadcn

---

# FASE 02 - DATABASE ✅ CONCLUÍDA

## T021 ✅
Instalar Prisma

## T022 ✅
Configurar datasource PostgreSQL

## T023 ✅
Criar migration inicial

## T024 ✅
Criar tabela tenants

## T025 ✅
Criar tabela users

## T026 ✅
Criar tabela roles

## T027 ✅
Criar tabela permissions

## T028 ✅
Criar tabela role_permissions

## T029 ✅
Criar índices principais

## T030 ✅
Criar seed inicial

---

## T031 ✅
Criar Super Admin

## T032 ✅
Criar roles padrão

## T033 ✅
Criar permissões padrão

---

# FASE 03 - AUTH ✅ CONCLUÍDA

## T034 ✅

Criar módulo Auth

## T035 ✅

Criar DTO Login

## T036 ✅

Criar DTO Refresh

## T037 ✅

Criar Password Hash Service

## T038 ✅

Implementar JWT

## T039 ✅

Implementar Refresh Token

## T040 ✅

Criar Login Endpoint

## T041 ✅

Criar Refresh Endpoint

## T042 ✅

Criar Logout Endpoint

## T043 ✅

Criar Forgot Password

## T044 ✅

Criar Reset Password

---

## T045 ✅

Criar testes unitários Auth

## T046 ✅

Criar testes integração Auth

## T047 ✅

Criar testes E2E Auth

---

# FASE 04 - MULTI TENANT ✅ CONCLUÍDA

## T048 ✅

Criar Tenant Middleware

## T049 ✅

Criar Tenant Context

## T050 ✅

Implementar Tenant Guard

## T051 ✅

Criar Tenant Decorator

## T052 ✅

Criar filtro por tenant

## T053 ✅

Criar testes isolamento

## T054 ✅

Criar endpoint cadastro tenant

## T055 ✅

Criar endpoint edição tenant

---

# FASE 05 - RBAC ✅ CONCLUÍDA

## T056 ✅
Criar módulo Roles

## T057 ✅
Criar módulo Permissions

## T058 ✅
Criar Permission Guard

## T059 ✅
Criar Roles Decorator

## T060 ✅
Criar endpoint gestão perfis

## T061 ✅
Criar endpoint gestão permissões

## T062 ✅
Criar testes RBAC
# FASE 06 - USERS ✅ CONCLUÍDA

## T063 ✅
Criar módulo Users

## T064 ✅
Criar CreateUser DTO

## T065 ✅
Criar UpdateUser DTO

## T066 ✅
Criar endpoint listagem

## T067 ✅
Criar endpoint consulta

## T068 ✅
Criar endpoint criação

## T069 ✅
Criar endpoint atualização

## T070 ✅
Criar endpoint exclusão lógica

## T071 ✅
Criar pagina usuários

## T072 ✅
Criar formulário usuário

## T073 ✅
Criar tabela usuários

## T074 ✅
Criar filtros

## T075 ✅
Criar paginação

---

# FASE 07 - PARLAMENTARES ✅ CONCLUÍDA

## T076 ✅
Criar tabela parliamentarians

## T077 ✅
Criar migration

## T078 ✅
Criar módulo Parliamentarians

## T079 ✅
Criar CRUD Parlamentares

## T080 ✅
Criar testes CRUD

---

# FASE 08 - EMENDAS ✅ CONCLUÍDA

## T081 ✅
Criar tabela emendas

## T082 ✅
Criar tabela emenda_history

## T083 ✅
Criar migration

## T084 ✅
Criar módulo Emendas

## T085 ✅
Criar DTO CreateEmenda

## T086 ✅
Criar DTO UpdateEmenda

## T087 ✅
Criar endpoint listagem

## T088 ✅
Criar endpoint consulta

## T089 ✅
Criar endpoint criação

## T090 ✅
Criar endpoint atualização

## T091 ✅
Criar endpoint exclusão

## T092 ✅
Criar endpoint histórico

## T093 ✅
Criar filtros por exercício

## T094 ✅
Criar filtros por parlamentar

## T095 ✅
Criar filtros por status

## T096 ✅
Criar pagina Emendas

## T097 ✅
Criar dashboard Emendas

## T098 ✅
Criar testes unitários

## T099 ✅
Criar testes integração

## T100 ✅
Criar testes E2E

---

# FASE 09 - SIOP ✅ CONCLUÍDA

## T101 ✅
Criar Cliente GraphQL

## T102 ✅
Configurar autenticação SIOP

## T103 ✅
Criar DTOs SIOP

## T104 ✅
Implementar mapeamentos de dados

## T105 ✅
Implementar sincronização manual

## T106 ✅
Implementar sincronização agendada

## T107 ✅
Configurar Jobs BullMQ

## T108 ✅
Criar Workers SIOP

## T109 ✅
Configurar Retry com backoff exponencial

## T110 ✅
Configurar Dead Letter Queue

## T111 ✅
Implementar logs estruturados

## T112 ✅
Implementar monitoramento básico

## T113 ✅
Criar endpoint reprocessamento

## T114 ✅
Criar endpoint sync-status

## T115 ✅
Criar testes unitários SIOP

## T116 ✅
Criar testes integração SIOP

## T117 ✅
Criar testes E2E SIOP

---

# FASE 10 - IMPEDIMENTOS ✅ CONCLUÍDA

## T131 ✅
Modelagem já existente no Prisma schema

## T132 ✅
Criar módulo Impediments

## T133 ✅
Criar DTOs CreateImpediment / UpdateImpediment

## T134 ✅
Criar DTOs Response / History

## T135 ✅
Criar CRUD endpoints

## T136 ✅
Criar serviço com regras de negócio

## T137 ✅
Validar vínculo com emenda no create

## T138 ✅
Implementar histórico automático de status

## T139 ✅
Validar impedimentos SIOP não podem ser deletados

## T140 ✅
Criar endpoint listagem com filtros

## T141 ✅
Criar endpoint consulta por ID

## T142 ✅
Criar endpoint atualização

## T143 ✅
Criar endpoint exclusão

## T144 ✅
Criar endpoint histórico

## T145 ✅
Integração com SIOP (já existente na sincronização)

## T146 ✅
Atualizar permissões e roles

## T147 ✅
Criar testes unitários

## T148 ✅
Criar testes integração

## T149 ✅
Criar testes E2E

## T150 ✅
Atualizar documentação Swagger

---

# FASE 11 - CONVÊNIOS ✅ CONCLUÍDA

## T151 ✅
Modelagem de dados (Convenio, ConvenioFinancialSchedule)

## T152 ✅
Criar módulo Convenios

## T153 ✅
Criar CreateConvenio DTO

## T154 ✅
Criar UpdateConvenio DTO

## T155 ✅
Criar ConvenioResponse DTO

## T156 ✅
Criar endpoint criação

## T157 ✅
Criar endpoint listagem

## T158 ✅
Criar endpoint consulta

## T159 ✅
Criar endpoint atualização

## T160 ✅
Criar endpoint exclusão (soft delete)

## T161 ✅
Criar cronograma financeiro (POST schedule)

## T162 ✅
Criar listagem cronograma (GET schedule)

## T163 ✅
Criar atualização cronograma (PATCH schedule)

## T164 ✅
Implementar recebimentos (receivedAmount, receivedDate)

## T165 ✅
Implementar cálculo de saldo (balance)

## T166 ✅
Implementar indicadores de convênios

## T167 ✅
Criar testes unitários

## T168 ✅
Criar testes de integração

## T169 ✅
Criar testes E2E

---

# FASE 12 - EXECUÇÃO FÍSICA ✅ CONCLUÍDA

## T181 ✅
Criar módulo PhysicalExecution

## T182 ✅
Criar DTOs de etapas (CreateStage, UpdateStage, StageResponse)

## T183 ✅
Criar DTOs de evolução (CreateProgress, ProgressResponse, ConvenioProgressResponse)

## T184 ✅
Criar CRUD de etapas (create, list, update, delete)

## T185 ✅
Criar registro de evolução física (record progress)

## T186 ✅
Criar endpoint de progresso consolidado do convênio

## T187 ✅
Implementar cálculo de percentuais (overallPercentage ponderado)

## T188 ✅
Criar endpoint listagem de histórico de progresso por etapa

## T189 ✅
Criar testes unitários

## T190 ✅
Criar testes de integração

## T191 ✅
Criar testes E2E

---

# FASE 13 - PRESTAÇÃO DE CONTAS ✅ CONCLUÍDA

## T201 ✅
Criar módulo Accountability (controller, service, DTOs)

## T202 ✅
Criar endpoint criação de relatório (POST /accountability-reports)

## T203 ✅
Criar endpoint listagem com filtros (GET /accountability-reports)

## T204 ✅
Criar endpoint consulta por ID (GET /accountability-reports/:id)

## T205 ✅
Criar endpoint atualização (PATCH /accountability-reports/:id)

## T206 ✅
Criar endpoint submissão (POST /accountability-reports/:id/submit)

## T207 ✅
Criar endpoint aprovação (POST /accountability-reports/:id/approve)

## T208 ✅
Criar endpoint reprovação (POST /accountability-reports/:id/reject)

## T209 ✅
Criar gerenciamento de itens (GET/POST /accountability-reports/:id/items)

## T210 ✅
Criar módulo Workflows (controller, service, DTOs)

## T211 ✅
Criar endpoint criação de workflow (POST /workflows)

## T212 ✅
Criar endpoint listagem de workflows (GET /workflows)

## T213 ✅
Criar endpoint gerenciamento de etapas (POST /workflows/:id/steps, GET /workflows/:id/steps)

## T214 ✅
Criar endpoint aprovação de approval (POST /approvals/:id/approve)

## T215 ✅
Criar endpoint rejeição de approval (POST /approvals/:id/reject)

## T216 ✅
Registrar módulos no AppModule

## T217 ✅
Criar testes unitários Accountability

## T218 ✅
Criar testes unitários Workflows

## T219 ✅
Criar testes de integração

## T220 ✅
Criar testes E2E

---

# FASE 14 - DOCUMENTOS ✅ CONCLUÍDA

T226 até T245

* Upload ✅
* Download ✅
* Versionamento ✅
* Armazenamento ✅
* Permissões ✅
* Testes ✅

---

# FASE 15 - ALERTAS ✅ CONCLUÍDA

## T246 ✅
Criar módulo Alerts

## T247 ✅
Criar DTO CreateAlert com validação de tipos

## T248 ✅
Criar DTO AlertResponse

## T249 ✅
Criar endpoint criação (POST /alerts)

## T250 ✅
Criar endpoint listagem com filtros (GET /alerts)

## T251 ✅
Criar endpoint não lidos (GET /alerts/unread)

## T252 ✅
Criar endpoint marcar como lido (PATCH /alerts/:id/read)

## T253 ✅
Criar endpoint marcar todos como lidos (POST /alerts/read-all)

## T254 ✅
Criar endpoint alerta de teste (POST /alerts/test)

## T255 ✅
Registrar módulo no AppModule

## T256 ✅
Criar testes unitários

## T257 ✅
Criar testes de integração

## T258 ✅
Criar testes E2E

## T259 ✅
Atualizar permissões e roles

## T260 ✅
Atualizar documentação Swagger

---

# FASE 16 - DASHBOARD EXECUTIVO ✅ CONCLUÍDA

## T261 ✅
Criar módulo Dashboard

## T262 ✅
Criar DashboardService com queries de agregação

## T263 ✅
Criar endpoint overview (GET /dashboard/overview)

## T264 ✅
Criar endpoint emendas por status (GET /dashboard/emendas)

## T265 ✅
Criar endpoint parlamentares (GET /dashboard/parliamentarians)

## T266 ✅
Criar endpoint áreas/tipo (GET /dashboard/areas)

## T267 ✅
Criar endpoint financeiro (GET /dashboard/financial)

## T268 ✅
Criar DTOs de resposta

## T269 ✅
Registrar módulo no AppModule

## T270 ✅
Atualizar permissões de dashboard

## T271 ✅
Criar testes unitários

## T272 ✅
Criar testes de integração

## T273 ✅
Criar testes E2E

## T274 ✅
Atualizar frontend overview com dados reais

## T275 ✅
Adicionar gráficos (PieChart, BarChart) com Recharts

## T276 ✅
Adicionar indicadores financeiros

---

# FASE 17 - RELATÓRIOS ✅ CONCLUÍDA

## T281 ✅
Criar módulo Reports

## T282 ✅
Instalar dependências (pdfkit, exceljs)

## T283 ✅
Criar DTO GenerateReport

## T284 ✅
Criar DTO ReportResponse

## T285 ✅
Implementar geração de PDF com pdfkit

## T286 ✅
Implementar geração de XLSX com exceljs

## T287 ✅
Implementar geração de CSV

## T288 ✅
Criar endpoint gerar relatório (POST /reports/generate)

## T289 ✅
Criar endpoint listagem (GET /reports)

## T290 ✅
Criar endpoint download (GET /reports/:id/download)

## T291 ✅
Registrar módulo no AppModule

## T292 ✅
Criar testes unitários

## T293 ✅
Criar testes E2E

## T294 ✅
Criar página de relatórios no frontend

## T295 ✅
Atualizar permissões e roles

---


# FASE 18 - OBSERVABILIDADE ✅ CONCLUÍDA

## T311 ✅
Criar módulo Health (controller, service, DTOs)

## T312 ✅
Criar endpoint GET /health com verificação API

## T313 ✅
Verificar conectividade do banco de dados (Prisma $queryRaw SELECT 1)

## T314 ✅
Verificar conectividade do Redis (TCP socket check)

## T315 ✅
Implementar logs estruturados no LoggerMiddleware (JSON com method, url, statusCode, duration, userAgent, ip, timestamp)

## T316 ✅
Criar testes unitários do HealthService

## T317 ✅
Criar testes E2E do módulo Health

## T318 ✅
Registrar módulo Health no AppModule

## T319 ✅
Registrar HealthController na documentação Swagger

## T320 ⬜
Implementar métricas (Prometheus /micrometers) — pendente

## T321 ⬜
Implementar tracing (OpenTelemetry) — pendente

## T322 ⬜
Dashboard operacional no frontend — pendente

---

# FASE 19 - DEPLOY ✅ CONCLUÍDA

## T326 ✅
Criar Dockerfile produção para API (multi-stage, Turbo monorepo-aware, Prisma migrations)

## T327 ✅
Criar Dockerfile produção para Web (multi-stage, Turbo monorepo-aware, Next.js start)

## T328 ✅
Atualizar docker-compose.prod.yml com serviços api e web

## T329 ✅
Instalar Docker build infra já existente (docker/docker-compose.yml) com PostgreSQL 16, Redis 7, RabbitMQ, Mailhog

## T330 ✅
Adicionar script de backup (scripts/backup.sh) com pg_dump e rotação de 7 dias

## T331 ✅
Adicionar script de restore (scripts/restore.sh) com pg_restore

## T332 ✅
Adicionar script de smoke test (scripts/smoke-test.sh) validando health check e auth

## T333 ✅
CI/CD pipeline (`.github/workflows/ci.yml`) atualizado com jobs: lint, test-backend, test-e2e, build, smoke-test, deploy

## T334 ✅
Deploy job condicional (branch main) com placeholder para target SSH/Docker

## T335 ✅
Migrações automáticas via `prisma migrate deploy` no CMD do Dockerfile.api

## T336 ✅
.env.example atualizado com variáveis de produção (POSTGRES_*, RABBITMQ_PASSWORD, API_PORT, WEB_PORT)

## T337 ⬜
Configurar ambiente staging (servidor/domínio) — pendente (requer infraestrutura real)

## T338 ⬜
Configurar ambiente produção (servidor/domínio) — pendente (requer infraestrutura real)
