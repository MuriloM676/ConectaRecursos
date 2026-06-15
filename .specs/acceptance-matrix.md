# acceptance-matrix.md

# CaptaGov - Acceptance Matrix

## AUTH-001 - Login

### Regra

Usuário deve autenticar utilizando e-mail e senha válidos.

### Critérios de Aceite

* Login com credenciais válidas retorna Access Token
* Login com credenciais inválidas retorna 401
* Usuário inativo não pode autenticar
* Tentativas inválidas são registradas

---

## AUTH-002 - Refresh Token

### Regra

Sistema deve renovar sessões sem novo login.

### Critérios de Aceite

* Refresh Token válido gera novo Access Token
* Refresh Token expirado retorna erro
* Refresh Token reutilizado é invalidado

---

## TENANT-001 - Isolamento de Dados

### Regra

Usuários só podem acessar dados do próprio tenant.

### Critérios de Aceite

* Consultas retornam apenas dados do tenant
* Acesso cruzado retorna 403
* Logs registram tentativa de acesso indevido

---

## USER-001 - Gestão de Usuários

### Regra

Administradores podem gerenciar usuários do tenant.

### Critérios de Aceite

* Criar usuário
* Editar usuário
* Desativar usuário
* Reativar usuário

---

## ROLE-001 - Controle de Acesso

### Regra

Permissões devem ser baseadas em papéis.

### Perfis

* Super Admin
* Admin Municipal
* Gestor
* Operador
* Visualizador

### Critérios de Aceite

* Restrições respeitadas
* Acesso negado quando necessário

---

## EMENDA-001 - Cadastro de Emendas

### Regra

Toda emenda deve possuir identificação única.

### Critérios de Aceite

* Número obrigatório
* Exercício obrigatório
* Autor obrigatório
* Valor obrigatório

---

## EMENDA-002 - Consulta de Emendas

### Critérios de Aceite

* Filtrar por exercício
* Filtrar por parlamentar
* Filtrar por status
* Filtrar por município

---

## EMENDA-003 - Histórico

### Regra

Alterações devem ser rastreáveis.

### Critérios de Aceite

* Histórico preservado
* Usuário responsável registrado
* Data registrada

---

## SIOP-001 - Sincronização

### Regra

Sistema deve sincronizar dados da API SIOP.

### Critérios de Aceite

* Sincronização manual
* Sincronização automática
* Logs disponíveis
* Falhas registradas

---

## SIOP-002 - Reprocessamento

### Critérios de Aceite

* Jobs podem ser reexecutados
* Histórico preservado
* Falhas identificadas

---

## IMP-001 - Impedimentos

### Critérios de Aceite

* Impedimento vinculado à emenda
* Histórico disponível
* Situação atualizada

---

## IMP-002 - Alertas de Impedimento

### Critérios de Aceite

* Alerta gerado automaticamente
* Usuários responsáveis notificados

---

## CONV-001 - Convênios

### Critérios de Aceite

* Convênio vinculado à emenda
* Situação atualizada
* Vigência registrada

---

## CONV-002 - Cronograma Financeiro

### Critérios de Aceite

* Parcelas previstas cadastradas
* Recebimentos registrados
* Saldo calculado automaticamente

---

## EXEC-001 - Execução Física

### Critérios de Aceite

* Evolução registrada
* Percentual calculado
* Histórico disponível

---

## DOC-001 - Gestão de Documentos

### Critérios de Aceite

* Upload realizado
* Download disponível
* Versionamento preservado

---

## PREST-001 - Prestação de Contas

### Critérios de Aceite

* Fluxo de aprovação
* Controle de pendências
* Histórico preservado

---

## ALERT-001 - Central de Alertas

### Critérios de Aceite

* Notificações configuráveis
* Histórico disponível
* Status de leitura registrado

---

## DASH-001 - Dashboard Executivo

### Critérios de Aceite

* Total captado
* Total recebido
* Total executado
* Atualização automática

---

## REL-001 - Relatórios

### Critérios de Aceite

* Exportação PDF
* Exportação Excel
* Exportação CSV

---

## API-001 - API Pública

### Critérios de Aceite

* API Key obrigatória
* Swagger disponível
* Rate Limit configurado

---

## OBS-001 - Observabilidade

### Critérios de Aceite

* Logs estruturados
* Health Checks
* Métricas disponíveis

---

## DEPLOY-001 - Infraestrutura

### Critérios de Aceite

* Docker Compose funcional
* PostgreSQL funcional
* Redis funcional
* RabbitMQ funcional

---

## BACKUP-001 - Recuperação

### Critérios de Aceite

* Backup automático
* Restauração validada
* Histórico de backups disponível
