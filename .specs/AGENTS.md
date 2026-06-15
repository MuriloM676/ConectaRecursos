# AGENTS.md

## Regras gerais
- Sempre ler arquivos em /specs antes de implementar
- Nunca implementar sem critérios de aceitação
- Código deve ser simples e legível
- Evitar overengineering

STOP DOCUMENTING.

Do not create new markdown files.

Use only:

.specs/*
tasks.md

Any additional .md file requires explicit user approval.

## Fluxo obrigatório
1. Ler as specs do diretório /specs
2. Gerar tasks.md se não existir
3. Implementar baseado nas tasks
4. Criar testes automatizados
5. Garantir que todos os critérios de aceitação passam

## Testes
- Priorizar cobertura dos critérios de aceitação
- Testes devem ser claros e diretos

## Restrições
- Não inventar requisitos não descritos
- Não alterar comportamento sem atualizar spec