# Raparigator — Gemini

Leia, nesta ordem, antes de qualquer coisa:

1. `AGENTS.md` — stack, comandos, estrutura, convenções e a lista "Nunca faça". É a regra do repo e prevalece sobre este arquivo.
2. `docs/roteiro.md` — fases, decisões tomadas (seção 2) e decisões pendentes (seção 7).
3. `docs/correcoes-pre-deploy.md` — **fase atual (2.1)**, obrigatória antes do deploy e antes da Fase 3. Leia o arquivo inteiro: regras duras (seção 0), evidências verificadas (seção 2.1), tasks T-40 a T-49 e o "Plano verificado" de cada uma.
4. `docs/adr/README.md` — a restrição de produto (vitrine, sem intermediação).

## Qual task pegar

- A primeira `[ ]` da seção 4 de `docs/correcoes-pre-deploy.md`, na ordem. Não pegue nada da Fase 3 do roteiro (T-30 a T-34): está fora de escopo.
- Pule uma task só se o "Plano verificado" dela disser **PARADO** e a pergunta correspondente na seção 5 ainda estiver sem resposta. Hoje: T-44 (P-14 e arquivo de teste fora da lista).

## Como executar uma task da Fase 2.1

1. Siga o "Plano verificado" da task: os arquivos listados ali, o teste vermelho ali descrito, os passos na ordem. Se o código atual divergir do plano (linha mudou, arquivo não existe), pare e descreva a diferença em vez de improvisar.
2. Primeiro o teste que falha na `main`; cole a saída da falha na descrição do PR. Depois implemente até passar.
3. Só toque nos "Arquivos permitidos" da task. Precisou de outro arquivo: pare e pergunte.
4. Achou outro problema: registre na seção 7 de `docs/correcoes-pre-deploy.md` (data, task, arquivo/evidência, impacto, sugestão) e siga. Não corrija.
5. Ao concluir: marque `[x]` com `(PR #nn, dd/mm)` em `docs/correcoes-pre-deploy.md`; se a task mudou algo que afeta uma task seguinte, ajuste o plano da seguinte no mesmo PR.

## Regras que você precisa seguir à risca

**Escopo**

- Uma task por vez, um PR por task. Faça só o que a task pede.
- Se a task depender de uma decisão que não está escrita (`docs/roteiro.md` seções 2 e 7, `docs/correcoes-pre-deploy.md` seção 5), **pare e pergunte**. Não invente regra de produto, preço, texto legal ou fluxo.
- Nunca mexa em `packages/domain/src/premium.ts` (`PREMIUM_PLAN_OPTIONS`) sem pedido explícito.

**Código**

- Tipo compartilhado só em `packages/contracts`. Se precisar de um campo novo, altere o schema Zod lá; o `tsc` dos dois lados vai avisar o que mais mudar. Nunca declare um tipo "parecido" à mão no web ou na API.
- Regra de negócio pura (sem React, sem Drizzle) vai em `packages/domain`, com teste.
- No web, dado da API vem **só** pelo client oRPC em `apps/web/lib/api/` (`getApiClient()`). Nenhum `fetch` solto, exceto o `PUT` na URL pré-assinada de upload de mídia.
- Não existe mais modo `mock`. Não use nem crie `isApiDataSource()` (a T-47 remove o que sobrou).
- Não escreva comentários no código. Textos de UI em PT-BR. Imports com `@/` dentro de `apps/web`.
- Versões de dependência pinadas (sem `^`, `~`). Se adicionar `better-auth` no web, use a mesma versão da API.

**Verificação (não é opcional)**

- Antes de dizer que terminou: `npm run check` e `npm run test` verdes. Se mexeu em `apps/web`, abra a tela no browser e confira. Antes de abrir PR: `npm run test:e2e`.
- Se um teste quebrar, conserte a causa. Nunca apague, pule ou afrouxe um teste para ficar verde: nada de `force: true`, `.skip`, `.only`, `waitForTimeout` ou timeout maior sem causa.
- E2E de um fluxo que você mexeu: rode com `--retries=0` (o retry da CI esconde flaky).
- Nunca commite `.env`/`.env.prod`/`.env.local` nem segredo; os `*.env.example` podem e devem ser editados quando a task pedir. Nunca rode `npm run share`.

**Git**

- Branch `fix/T-4x-nome-curto` (Fase 2.1) ou `feat/T-xx-nome-curto` a partir da `main`; PR para a `main`; commit convencional em português (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`).
- Ao concluir a task, marque `[x]` com `(PR #nn, dd/mm)` no arquivo onde ela está (`docs/correcoes-pre-deploy.md` na Fase 2.1), no mesmo PR.
- PR entra com `gh pr merge <n> --rebase --delete-branch` (histórico linear). Pronto = CI verde no PR **e** no push da `main` depois do merge.

**Quando terminar uma task, responda em 5 linhas no máximo**: o que mudou, como verificou, o que ficou pendente, qual é a próxima task.
