# ADR-016 — Virada para API e Remoção dos Mocks

- Status: aceito (2026-10-09)

## Contexto

Desde o início da migração (ADR-008 a ADR-015, tasks T-10 a T-18), o frontend (`apps/web`) operava em modo dual controlado pela variável `NEXT_PUBLIC_DATA_SOURCE=mock|api`. Esse mecanismo permitiu que cada módulo fosse integrado incrementalmente à API TypeScript (`@sigillus/api`) mantendo a suíte de testes E2E Playwright verde a cada PR.

Com a conclusão da Task T-18 (backoffice administrativo), 100% das áreas do sistema (Feed, Catálogos e Anúncios Públicos, Autenticação e Sessão com better-auth, Rascunho de Anúncios, Mídia e Galeria, Chat e Mensagens com SSE, Avaliações e Convites, Notificações, Assinatura Premium e Backoffice Administrativo) possuem implementações completas no servidor conectadas ao banco Postgres via Drizzle ORM e contratos oRPC.

Permaneciam no repositório artefatos legados de mock: `mock-data.ts`, `mock-users.ts`, flags e condicionais dual-mode em `data-source.ts`, além da suíte E2E rodando em memória sobre dados sintéticos locais.

## Decisão

**Desligar definitivamente o modo dual, remover os arquivos de mock do frontend e unificar toda a comunicação do `apps/web` exclusivamente com a API, com a suíte E2E Playwright executando 100% contra o backend real.**

1. **Remoção de Mocks e Fontes Locais**:
   - Exclusão completa de `apps/web/lib/mock-data.ts` e `apps/web/lib/mock-users.ts`.
   - Simplificação de `apps/web/lib/data-source.ts`, mantendo apenas utilitários de URL da API (`getApiUrl()`), com `isApiDataSource()` fixado em `true`.
   - Remoção de branches de fallback mock em stores e adaptadores (`account-notifications.ts`, `announcement-draft.ts`, `admin-service.ts`, etc.).
   - Remoção de domínios externos fictícios (`picsum.photos`, `images.pexels.com`) de `next.config.ts`, mantendo apenas o host de storage e CDNs homologadas.

2. **Unificação da Suíte E2E contra a API**:
   - `playwright.config.ts`: configuração de `webServer` duplo (API na porta 4001 e Web na porta 3000/3100 com `NEXT_PUBLIC_API_URL` apontando para a API).
   - `globalSetup`: inicialização e orquestração de setup automatizado de sessão e cookies autenticados via `better-auth`.
   - `tests/helpers/auth.ts`: `seedUserRole` e `seedAdminSession` passam a realizar autenticação real via API (`/api/auth/sign-in/email` e `/api/admin-auth/sign-in/email`), injetando os cookies de sessão de cliente, profissional e admin.
   - Ajustes pontuais nos testes E2E (`feed.spec.ts`, `encounter-brief.spec.ts`, `ad-details.spec.ts`, `gallery-profile-photo.spec.ts`, `review-invite.spec.ts`) para sincronização com dados reais de seed (`dev-data.ts`).
   - Adição de `RATE_LIMIT_ENABLED` configurável na API para permitir execução paralela de testes sem falso-positivo de rate limiting (429).

## Consequências

- `grep -r mock-data apps/web` e `grep -r mock-users apps/web` não retornam nenhuma ocorrência.
- A aplicação web conecta-se 100% à API pelo client oRPC tipado e clientes better-auth.
- A suíte completa de testes E2E Playwright (71 testes em Chromium) passa 100% verde executando requisições reais contra a API e o Postgres.
- A Fase 1 do roteiro de desenvolvimento está concluída com sucesso.
