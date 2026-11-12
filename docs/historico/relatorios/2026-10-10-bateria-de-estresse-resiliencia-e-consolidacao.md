# Relatório de Estresse, Resiliência e Consolidação da Fase 2 (T-28)

**Data:** 10/10/2026  
**Responsável:** Antigravity (Pair Programming)  
**Status da Fase 2:** Concluída e Consolidada

---

## 1. Resumo Executivo

Como encerramento da **Fase 2 (Hardening e Produção)**, executamos uma bateria abrangente de testes automatizados de estresse, concorrência, idempotência e resiliência na API e no Web. O objetivo foi certificar que a plataforma Sigillus suporta cargas concorrentes elevadas, rajadas de requisições, múltiplos assinantes simultâneos em tempo real (SSE) e ações repetidas de interface sem degradação, inconsistência relacional ou vazamento de recursos.

Todos os cenários foram aprovados com 100% de sucesso. A suíte total de testes automatizados do monorepo agora conta com **158 testes unitários/integração** e **78 testes E2E do Playwright**.

---

## 2. Cenários de Concorrência e Estresse na API (`stress-concurrency.test.ts`)

A nova suíte `apps/api/tests/stress-concurrency.test.ts` foi incorporada aos testes de integração da API contra o Postgres e MinIO:

1. **Envio Concorrente Massivo de Mensagens**:
   - **Cenário**: 20 mensagens enviadas simultaneamente em paralelo (`Promise.allSettled`) na mesma conversa entre cliente e profissional.
   - **Resultado**: 20/20 mensagens aceitas e persistidas. Ordem cronológica mantida no cursor, `unread` e `lastMessage` atualizados sem corrupção ou deadlocks no banco de dados.
2. **Streaming Concorrente de Chat (SSE / `streamEvents`)**:
   - **Cenário**: 10 assinantes concorrentes conectados simultaneamente ao canal de eventos via gerador assíncrono, submetidos a rajadas de publicações de eventos.
   - **Resultado**: 100% dos eventos entregues a todos os assinantes. Cancelamento de conexões via `AbortSignal` sem memory leaks ou timers pendentes no Node.js.
3. **Corrida Crítica em Avaliações (Review Gate Concurrency)**:
   - **Cenário**: 5 submissões concorrentes em paralelo para o mesmo convite de avaliação (`invite.token`).
   - **Resultado**: Exatamente 1 avaliação aprovada e registrada (`status: 200`). As outras 4 foram atômica e corretamente rejeitadas com erro de conflito (`CONFLICT`), provando que a transação isolada com `where isNull(usedAt)` impede double-review.
4. **Idempotência de Webhook e Assinaturas (Billing Reducer Concurrency)**:
   - **Cenário**: Rajada de 10 inserções concorrentes em `subscription_event` com a mesma chave de idempotência (`idempotencyKey`).
   - **Resultado**: Exatamente 1 evento inserido (`onConflictDoNothing`), garantindo determinismo na máquina de estados da assinatura.
5. **Carga Massiva no oRPC (Pool e Latência)**:
   - **Cenário**: Rajada de 50 requisições simultâneas alternando entre `feed/list` e `catalogs/get`.
   - **Resultado**: 100% das requisições responderam HTTP 200 em ~1.2s sem esgotamento do pool de conexões do Postgres (`DATABASE_POOL_MAX=10`).

---

## 3. Cenários de Estresse e Resiliência na UI (`stress-resilience.spec.ts`)

A nova suíte `apps/web/tests/stress-resilience.spec.ts` foi adicionada ao Playwright:

1. **Rajadas Rápidas de Filtros no Feed**:
   - Mutações rápidas e alternadas de filtros ("Premium", "Com local", ordenações) sem travamento de renderização, sem telas brancas e sem erros de reconciliação do React 19.
2. **Prevenção de Duplo Envio (Double-Submit)**:
   - Cliques rápidos repetidos no botão "Enviar interesse" no briefing do chat. A interface impede a duplicação do card e fecha a prévia de forma atômica.
3. **Navegação SPA Sob Estresse**:
   - Transições rápidas entre `/feed`, `/termos`, `/privacidade` e página de anúncio `/anuncio/:slug`. O cliente mantém o estado íntegro e renderiza todos os dados interativos.

---

## 4. Consolidação das Suítes do Monorepo

| Escopo                         | Ferramenta                    | Total de Testes              | Status                   | Tempo Médio |
| :----------------------------- | :---------------------------- | :--------------------------- | :----------------------- | :---------- |
| **Lint e Formatação**          | `oxlint` + `oxfmt`            | 420 arquivos analisados      | **0 warnings / 0 erros** | < 1s        |
| **Typecheck**                  | `tsc --noEmit` (4 workspaces) | Todos os módulos e contratos | **Aprovado**             | ~6s         |
| **Regras Puras de Domínio**    | Vitest (`@sigillus/domain`)   | 34 testes                    | **34/34 aprovados**      | ~0.2s       |
| **Integração e Contratos API** | Vitest (`@sigillus/api`)      | 124 testes (15 arquivos)     | **124/124 aprovados**    | ~46s        |
| **Ponta a Ponta (E2E)**        | Playwright (`@sigillus/web`)  | 78 testes (13 arquivos)      | **78/78 aprovados**      | ~38s        |

---

## 5. Próximos Passos (Transição para a Fase 3)

Com a aprovação da Task T-28, a **Fase 2 está oficialmente finalizada**. A aplicação está pronta para deploy estável em produção conforme os manuais `docs/deploy.md` e `docs/smoke.md`.

A **Fase 3 (Monetização)** permanece congelada por decisão de produto registrada no roteiro até o momento em que a cobrança por assinatura premium for aberta.
