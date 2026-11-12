# ADR-008 — Migração Web Dual-Mode e Integração com Better-Auth

- Status: aceito (2026-10-08)

## Contexto

A API está 100% implementada com Hono, oRPC, better-auth, Drizzle ORM e Postgres. O frontend Next.js (`apps/web`), contudo, utilizava stubs em `lib/mock-data.ts` e `localStorage` para a maioria das funcionalidades.
Precisávamos integrar autenticação, sessão e os módulos restantes da API sem quebrar a suíte de testes E2E do Playwright (que roda em modo `mock` para garantir zero regressão visual durante o desenvolvimento) e sem adotar uma migração "big-bang".

## Opções consideradas

- **Migração big-bang** — desligar todos os mocks de uma vez e apontar o web exclusivamente para a API. Descartado: tornaria os PRs gigantescos, quebrando testes existentes e impedindo a validação incremental de cada tela.
- **Substituição direta do localStorage mantendo mock paralelo sem padrão unificado** — cada módulo inventar sua própria estratégia de chaveamento. Descartado: geraria inconsistência e bugs de concorrência de sessão.
- **Dual-mode com flag de ambiente (`NEXT_PUBLIC_DATA_SOURCE=mock|api`) + better-auth clients tipados** — cada hook ou adaptador encapsula a decisão entre chamar o client da API / better-auth ou utilizar o mock local.

## Decisão

**Adotar a estratégia Dual-Mode via `isApiDataSource()` e integrar `better-auth` pinado na mesma versão da API (`1.6.29`).**

1. **Clients Dedicados de Autenticação**:
   - `apps/web/lib/api/auth-client.ts`: client do better-auth para usuários comuns (cliente e profissional) apontando para `/api/auth`, com `credentials: "include"` e `inferAdditionalFields` (`role`, `cpf`, `phone`, `city`, `alias`).
   - `apps/web/lib/api/admin-auth-client.ts`: client isolado para o backoffice de administradores apontando para `/api/admin-auth`.

2. **Sessão Unificada via Hooks**:
   - `useAuthSession` em `apps/web/lib/auth-session.ts`: no modo `api`, consome `authClient.useSession()` e enriquece com `getApiClient().auth.me()` para carregar os dados completos do usuário (como o `plan` da profissional resolvido no banco). `logout()` chama `authClient.signOut()`. No modo `mock`, preserva o store em `localStorage` intacto.
   - `useAdminSession` em `apps/web/lib/admin-session.ts`: mesmo padrão para o painel admin.
   - Ambos exportados condicionalmente no nível do módulo (`isApiDataSource() ? useApiSession : useMockSession`), respeitando as regras estritas de hooks do React sem condicionais no corpo das funções.

3. **Tratamento de Erros e Testes**:
   - `apps/web/lib/auth-errors.ts`: função pura `translateAuthError` que converte erros do better-auth para mensagens claras em PT-BR na interface.
   - `apps/web/tests/helpers/auth.ts`: helpers `loginViaApi` e `loginAdminViaApi` que autenticam via POST direto e injetam os cookies de sessão no contexto do Playwright, permitindo testes E2E reais quando desejado sem alterar os helpers mock existentes.

4. **Guia para os Próximos Módulos (T-12 em diante)**:
   - Todo módulo autenticado subsequente (anúncios, mídia, chat, avaliações, notificações, premium, backoffice) deve:
     - Obter `user`, `role` ou `isAdmin` diretamente de `useAuthSession()` ou `useAdminSession()`.
     - Utilizar `getApiClient().<modulo>.<metodo>()` quando `isApiDataSource()` for verdadeiro.
     - Preservar o fallback para mock/localStorage quando falso até a conclusão da fase 1 (T-19).
     - Importar contratos e tipos estritamente de `@sigillus/contracts`.

## Consequências

- A suíte E2E de 71 testes continua rodando e passando 100% verde em modo `mock`.
- Telas públicas e privadas autenticam e leem dados reais do banco quando `NEXT_PUBLIC_DATA_SOURCE=api`.
- Qualquer agente ou desenvolvedor que implementar as próximas tasks possui um padrão consolidado e documentado para consumir a sessão e a API.
