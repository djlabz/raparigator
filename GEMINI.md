# Raparigator — Gemini

Leia, nesta ordem, antes de qualquer coisa:

1. `AGENTS.md` — stack, comandos, estrutura, convenções e a lista "Nunca faça". É a regra do repo e prevalece sobre este arquivo.
2. `docs/roteiro.md` — o que falta fazer, em ordem, com as decisões já tomadas. Pegue a primeira task `[ ]` da fase atual.
3. `docs/adr/README.md` — a restrição de produto (vitrine, sem intermediação) e a ordem de migração dos mocks.

## Regras que você precisa seguir à risca

**Escopo**

- Uma task do roteiro por vez. Faça só o que a task pede. Se achar outra coisa quebrada, anote como task nova em `docs/roteiro.md` e siga.
- Se a task depender de uma decisão que não está em `docs/roteiro.md` (seções 2 e 7), **pare e pergunte**. Não invente regra de produto, preço, texto legal ou fluxo.
- Nunca mexa em `packages/domain/src/premium.ts` (`PREMIUM_PLAN_OPTIONS`) sem pedido explícito.

**Código**

- Tipo compartilhado só em `packages/contracts`. Se precisar de um campo novo, altere o schema Zod lá; o `tsc` dos dois lados vai avisar o que mais mudar. Nunca declare um tipo "parecido" à mão no web ou na API.
- Regra de negócio pura (sem React, sem Drizzle) vai em `packages/domain`, com teste.
- No web, dado da API vem **só** pelo client oRPC em `apps/web/lib/api/` (`getApiClient()`). Nenhum `fetch` solto, exceto o `PUT` na URL pré-assinada de upload de mídia.
- Siga o padrão de `apps/web/lib/feed-data.ts` para migrar um módulo: o hook decide entre `mock` e `api` com `isApiDataSource()`. Não quebre o modo `mock` até a task T-19.
- Não escreva comentários no código. Textos de UI em PT-BR. Imports com `@/` dentro de `apps/web`.
- Versões de dependência pinadas (sem `^`, `~`). Se adicionar `better-auth` no web, use a mesma versão da API.

**Verificação (não é opcional)**

- Antes de dizer que terminou: `npm run check` e `npm run test` verdes. Se mexeu em `apps/web`, abra a tela no browser e confira. Antes de abrir PR: `npm run test:e2e`.
- Se um teste quebrar, conserte a causa. Nunca apague, pule ou afrouxe um teste para ficar verde.
- Nunca commite `.env*` nem segredo. Nunca rode `npm run share`.

**Git**

- Branch `feat/T-xx-nome-curto` a partir da `main`; PR para a `main`; commit convencional em português (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`).
- Ao concluir a task, marque `[x]` em `docs/roteiro.md` com `(PR #nn, dd/mm)` no mesmo PR.

**Quando terminar uma task, responda em 5 linhas no máximo**: o que mudou, como verificou, o que ficou pendente, qual é a próxima task.
