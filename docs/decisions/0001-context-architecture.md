# ADR-0001: Arquitetura minima de contexto para agentes

## Status

Aceita

## Contexto

O repositorio nao tinha `AGENTS.md`, `CLAUDE.md`, `docs/decisions/` ou `memory-bank/`.
O `README.md` era boilerplate de `create-next-app` e nao registrava convencoes reais.
As decisoes do projeto estavam implicitas em codigo e configuracao: Next.js App Router, React 19, TypeScript strict, Tailwind v4, `npm` com `package-lock.json`, mock auth via `localStorage` e dados mockados em `lib/`.
O objetivo e maximizar aderencia de agentes com baixo custo de contexto e baixa contaminacao de memoria.

## Opcoes Consideradas

1. Criar somente `AGENTS.md`.
2. Criar `AGENTS.md`, ADRs e memory bank minimo.
3. Criar documentacao ampla, personas, skills e rules locais.

## Decisao

Adotar `AGENTS.md` como fonte canonica always-on.
Criar `CLAUDE.md` apenas como adapter fino se Claude Code for usado.
Criar `docs/decisions/` para decisoes duraveis e rejeicoes.
Criar `memory-bank/project-brief.md` para contexto estavel e `memory-bank/active-context.md` para snapshot pequeno e regravavel.
Manter regras por caminho dentro do `AGENTS.md` enquanto o repositorio for pequeno.
Nao criar persona, skills, docs de prompt, `memory-bank/standards.md`, `memory-bank/progress.md` ou `memory-bank/known-pitfalls.md` neste momento.

## Consequencias

- O contexto always-on fica curto e verificavel.
- Decisoes rejeitadas passam a ter lugar proprio.
- Contexto ativo nao vira diario infinito.
- Detalhes longos de arquitetura ficam sob demanda.
- Se o projeto crescer, regras por caminho podem migrar para `AGENTS.md` aninhados.

## Rejeicoes

- Nao usar Tree-sitter agora; `rg`, TypeScript, ESLint e inspecao local bastam para este tamanho de repo.
- Nao criar skills agora; nenhum workflow repetitivo longo foi comprovado.
- Nao criar persona de agente; ela aumenta custo sem impor convencoes verificaveis.
- Nao trocar `npm` por `pnpm`, `yarn` ou `bun` sem nova ADR.
- Nao transformar documentacao longa em contexto always-on.
