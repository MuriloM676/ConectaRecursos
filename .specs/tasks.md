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

---

# FASE 06 - USERS

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

## T071 🔜 PRÓXIMA
Criar pagina usuários

## T072

Criar formulário usuário

## T073

Criar tabela usuários

## T074

Criar filtros

## T075

Criar paginação

---

# FASE 07 - PARLAMENTARES

## T076

Criar tabela parliamentarians

## T077

Criar migration

## T078

Criar módulo Parliamentarians

## T079

Criar CRUD Parlamentares

## T080

Criar testes CRUD

---

# FASE 08 - EMENDAS

## T081

Criar tabela emendas

## T082

Criar tabela emenda_history

## T083

Criar migration

## T084

Criar módulo Emendas

## T085

Criar DTO CreateEmenda

## T086

Criar DTO UpdateEmenda

## T087

Criar endpoint listagem

## T088

Criar endpoint consulta

## T089

Criar endpoint criação

## T090

Criar endpoint atualização

## T091

Criar endpoint exclusão

## T092

Criar endpoint histórico

## T093

Criar filtros por exercício

## T094

Criar filtros por parlamentar

## T095

Criar filtros por status

## T096

Criar pagina Emendas

## T097

Criar dashboard Emendas

## T098

Criar testes unitários

## T099

Criar testes integração

## T100

Criar testes E2E

---

# FASE 09 - SIOP

T101 até T130

* Cliente GraphQL
* Autenticação
* DTOs
* Mapeamentos
* Sincronização Manual
* Sincronização Agendada
* Jobs BullMQ
* Workers
* Retry
* Dead Letter Queue
* Logs
* Monitoramento
* Reprocessamento
* Testes

---

# FASE 10 - IMPEDIMENTOS

T131 até T150

* Modelagem
* CRUD
* Histórico
* Integração SIOP
* Dashboard
* Alertas
* Testes

---

# FASE 11 - CONVÊNIOS

T151 até T180

* Modelagem
* CRUD
* Cronograma Financeiro
* Recebimentos
* Saldo
* Indicadores
* Testes

---

# FASE 12 - EXECUÇÃO FÍSICA

T181 até T200

* Etapas
* Evolução
* Fotos
* Percentuais
* Relatórios
* Testes

---

# FASE 13 - PRESTAÇÃO DE CONTAS

T201 até T225

* Cadastro
* Workflow
* Aprovação
* Reprovação
* Pendências
* Histórico
* Testes

---

# FASE 14 - DOCUMENTOS

T226 até T245

* Upload
* Download
* Versionamento
* Armazenamento
* Permissões
* Testes

---

# FASE 15 - ALERTAS

T246 até T260

* E-mail
* Dashboard
* Webhooks
* Templates
* Histórico
* Testes

---

# FASE 16 - DASHBOARD EXECUTIVO

T261 até T280

* KPIs
* Agregações
* Materialized Views
* Gráficos
* Exportação
* Testes

---

# FASE 17 - RELATÓRIOS

T281 até T295

* PDF
* Excel
* CSV
* Templates
* Exportações

---


# FASE 18 - OBSERVABILIDADE

T311 até T325

* Health Checks
* Logs Estruturados
* Métricas
* Tracing
* Dashboards Operacionais

---

# FASE 19 - DEPLOY

T326 até T350

* Docker Production
* CI/CD
* GitHub Actions
* Build Backend
* Build Frontend
* Migrations Automáticas
* Backups
* Restore
* Ambiente Staging
* Ambiente Produção
* Smoke Tests
