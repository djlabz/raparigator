# Raparigator — Gemini

Leia, nesta ordem, antes de qualquer coisa:

1. `AGENTS.md` — stack, comandos, estrutura, convenções e a lista "Nunca faça". É a regra do repo e prevalece sobre este arquivo.
2. `docs/roteiro.md` — fases, decisões tomadas (seção 2) e decisões pendentes (seção 7).
3. `docs/correcoes-juridico.md` — **fase atual (Fase J, jurídica e de privacidade)**. Leia o arquivo inteiro: regras adicionais (seção 0), verificação (seção 1.1), ordem de execução, tasks e o "Plano verificado" de cada uma, decisões (seção 4), dívida (seção 5) e achados (seção 6).
   - As regras duras da seção 0 de `docs/correcoes-pre-deploy.md` (Fase 2.1, concluída) continuam valendo integralmente.
4. `docs/adr/README.md` — a restrição de produto (vitrine, sem intermediação).

## Qual task pegar

- A primeira `[ ]` da seção 3 de `docs/correcoes-juridico.md`, na "Ordem de execução" escrita no topo da seção. A T-69 não inicia (aguarda a lista do operador). Não pegue nada da Fase 3 do roteiro (T-30 a T-34): está fora de escopo.
- Pule uma task só se o "Plano verificado" dela disser **PARADO** e a pergunta correspondente na seção 4 ainda estiver sem resposta.

## Como executar uma task da Fase J

1. Siga o "Plano verificado" da task: os arquivos listados ali, o teste vermelho ali descrito, os passos na ordem. Se o código atual divergir do plano (linha mudou, arquivo não existe), pare e descreva a diferença em vez de improvisar.
2. Primeiro o teste que falha na `main`; cole a saída da falha na descrição do PR. Depois implemente até passar.
3. Só toque nos "Arquivos permitidos" da task. Precisou de outro arquivo: pare e pergunte.
4. Achou outro problema: registre na seção 6 de `docs/correcoes-juridico.md` (data, task, arquivo/evidência, impacto, sugestão) e siga. Não corrija.
5. Ao concluir: marque `[x]` com `(PR #nn, dd/mm)` em `docs/correcoes-juridico.md`; se a task mudou algo que afeta uma task seguinte, ajuste o plano da seguinte no mesmo PR.

## Regras que você precisa seguir à risca

**Escopo**

- Uma task por vez, um PR por task. Faça só o que a task pede.
- Se a task depender de uma decisão que não está escrita (`docs/roteiro.md` seções 2 e 7, `docs/correcoes-pre-deploy.md` seção 5, `docs/correcoes-juridico.md` seção 4), **pare e pergunte**. Não invente regra de produto, preço, texto legal ou fluxo.
- Toda feature nova que toque anúncio, contato, mídia, pagamento ou dados pessoais passa pelo checklist de `validacao-juridica` antes da implementação; o resultado vai na descrição do PR (skill em `.agents/skills/validacao-juridica/SKILL.md`).
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

- Branch `feat/T-xx-nome-curto` ou `fix/T-xx-nome-curto` a partir da `main`; PR para a `main`; commit convencional em português (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`).
- Ao concluir a task, marque `[x]` com `(PR #nn, dd/mm)` no arquivo onde ela está (`docs/correcoes-juridico.md` na Fase J), no mesmo PR.
- PR entra só por `scripts/merge-pr.sh <n>` (nunca `gh pr merge` direto). Pronto = CI verde no PR **e** no push da `main` depois do merge, inclusive em PR só de docs; run cancelada ou estourada é falha, não se re-roda para passar.

**Quando terminar uma task, responda em 5 linhas no máximo**: o que mudou, como verificou, o que ficou pendente, qual é a próxima task.
