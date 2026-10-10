# Roteiro de lançamento — Sigillus (raparigator)

Fonte de verdade do **que falta fazer** para o app ir ao ar. Complementa o `AGENTS.md` (como trabalhar) e as ADRs (por que a stack é assim). Vale para quem estiver executando: Daniel, Claude Code ou Gemini.

Estado consolidado em **04/10/2026**, a partir da `main` (commit `a4a6841`), com `npm run check`, `npm run test` (31 domain + 93 API) e análise de todo o código.

## 0. Como usar este arquivo

1. Antes de qualquer task, leia este arquivo e o `AGENTS.md`. Não leia só a task: leia a fase inteira em que ela está.
2. Pegue a **primeira task `[ ]` da fase atual**, a menos que o Daniel aponte outra. Não pule fase.
3. **Uma task = um PR** de uma branch `feat/T-xx-nome-curto` para a `main`. Nada direto na `main`.
4. Ao concluir: marque `[x]`, anote `(PR #nn, dd/mm)` ao lado e, se aprendeu algo que muda uma task seguinte, edite a task seguinte. Nunca deixe descoberta solta em comentário ou chat: ou vira task, ou vira ajuste de task.
5. Se a task pedir uma decisão que não está na seção 2 nem na seção 7, **pare e pergunte** ao Daniel. Não decida regra de produto sozinho.
6. Critério de pronto de toda task, sem exceção: `npm run check` e `npm run test` verdes; `npm run test:e2e` verde antes de abrir o PR; nada em `.env*` commitado; nenhum tipo declarado fora de `packages/contracts`; nenhuma regra pura fora de `packages/domain`.

## 1. Estado atual

**O que existe e funciona**

- Monorepo npm: `apps/web` (Next 16), `apps/api` (Hono + oRPC + Drizzle + better-auth + pg-boss), `packages/contracts` (contrato oRPC + Zod, fonte dos tipos), `packages/domain` (regras puras).
- API completa segundo o contrato: 12 módulos, ~70 procedimentos, todos com teste de integração. Lista em `packages/contracts/src/router.ts`; docs em `http://localhost:4000/api/docs` com a API rodando.
- Auth real com better-auth: instância de usuário (`/api/auth/*`, cookie `sigillus`) e instância separada de admin (`/api/admin-auth/*`, cookie `sigillus-admin`, sem sign-up).
- Fluxo de moderação já existe na API: profissional publica → perfil vai para `pending_review` → admin aprova ou rejeita em `admin.approveProfile` / `admin.rejectProfile`. Só perfil `published` + `listingStatus = Ativo` + não suspenso aparece no feed.
- Premium por event sourcing (`subscription_events`), pronto para receber um provedor de pagamento real na interface `BillingProvider`.
- `proxy.ts` do web protege `(private)` e `(admin)` nos dois modos (`mock` e `api`).
- Dockerfile da API, CI com Postgres de serviço, migrations idempotentes no boot.

**O que é mock ou stub**

- No web, só o **Feed** (`apps/web/lib/feed-data.ts`) fala com a API. Todo o resto lê `lib/mock-data.ts` + `localStorage`: auth, admin-session, rascunho, mídia, chat, convites de avaliação, notificações, plano premium, verificação. 23 arquivos importam `mock-data.ts`.
- Na API: `FakeBillingProvider` (único provedor), `VerificationNotifier` que só loga (nenhum e-mail ou SMS sai), `media.moderate` que marca `ready` sem checar nada.
- Não existe: recuperação de senha, CLI para criar o primeiro admin, páginas de Termos e Privacidade, exclusão de conta, Dockerfile do web.

## 2. Decisões tomadas (04/10/2026)

| #    | Decisão                                                                                              | Consequência prática                                                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | **Lançamento inicial gratuito.** Sem PSP, sem cobrança.                                              | Nenhuma integração de pagamento antes do ar. O módulo `premium` fica no código, o checkout fica escondido na UI (T-22).                                                                 |
| D-02 | **Preços guardados** para quando começar a cobrar: R$ 10 mensal, R$ 30 semestral (50% off).          | Ficam em `packages/domain/src/premium.ts` (`PREMIUM_PLAN_OPTIONS`). **Não remover nem alterar** sem o Daniel pedir.                                                                     |
| D-03 | **Entrada livre.** Cadastro sem verificação obrigatória de e-mail ou telefone.                       | Verificação vira opcional por flag (T-21). O gate de qualidade é a aprovação manual do admin, que já existe.                                                                            |
| D-04 | **Daniel gerencia perfis ativos pelo dashboard admin.**                                              | Fluxo `pending_review → published` da API é mantido como está. O backoffice (passo 10) sobe de prioridade dentro da fase 2: sem ele integrado, não há como aprovar ninguém em produção. |
| D-05 | **Daniel toca o projeto sozinho.** Marco não revisa PRs.                                             | O revisor é a CI. Todo PR precisa de `check`, `test` e E2E verdes. Nenhum merge com CI vermelha, nem "arrumo depois".                                                                   |
| D-06 | **`main` é a única branch de longa duração.** `development` foi apagada.                             | Referências a `development` em README, AGENTS e CI são bug (T-02).                                                                                                                      |
| D-07 | Regras de agente ficam **commitadas** no repo (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, este roteiro). | Nada de `CLAUDE.local.md` ou `GEMINI.md` fora do git: foi assim que o projeto perdeu o fio.                                                                                             |
| D-08 | Restrição de produto continua: **vitrine de anúncios**, sem intermediação de serviço.                | Ver `docs/adr/README.md`. Vale para toda task deste roteiro.                                                                                                                            |

## 3. Fase 0 — higiene (um PR só)

- [x] **T-01 Commitar as alterações locais pendentes.** Há 9 arquivos modificados no PC do Daniel sem commit (`.env.example` na raiz, `.mcp.json`, `compose.yaml`, `package.json`, `apps/api/package.json`, `apps/api/src/config.ts`, `apps/api/tests/config.test.ts`, `apps/api/tests/setup.ts`, `scripts/setup-env.mjs`). Antes de commitar: ler o diff inteiro, rodar `npm run format` (o `.mcp.json` já está fora do padrão do oxfmt), `npm run check` e `npm run test`. Se `scripts/setup-env.mjs` for um gerador de `.env`, documentar em uma linha no README (seção "Rodando") e garantir que ele nunca escreve segredo em arquivo versionado. Commit: `chore: script de setup de env e ajustes de config`. (04/10/2026)
- [x] **T-02 Trocar `development` por `main`.** `README.md` (seção Contribuindo), `AGENTS.md` (Convenções), `.github/workflows/ci.yml` (`pull_request.branches: [main]` e `push.branches: [main]`). Com isso a CI também roda em push na `main`, o que hoje não acontece. (04/10/2026)
- [x] **T-03 Destravar o Claude Code.** Em `.claude/settings.json`: remover `Edit(package-lock.json)` do `deny` (toda task que adiciona dependência precisa mexer no lockfile) e adicionar ao `allow`: `Bash(npm run check)`, `Bash(npm run test)`, `Bash(npm run test:e2e)`, `Bash(npm run format)`, `Bash(npm run db:*)`, `Bash(npx playwright test:*)`. Manter o `deny` de `npm run share` e de `.env*`. (04/10/2026)
- [x] **T-04 Apontar os agentes para este roteiro.** Adicionar `GEMINI.md` na raiz (mesmo espírito do `CLAUDE.md`). No `AGENTS.md`, logo após o primeiro parágrafo, adicionar: "O que falta fazer, em ordem, está em `docs/roteiro.md`. Leia antes de começar qualquer task." Em `docs/adr/README.md`, na seção "Ordem sugerida de desligamento dos mocks", adicionar uma linha apontando que o acompanhamento está em `docs/roteiro.md`. (04/10/2026)

## 4. Fase 1 — integração web → API

Ordem é a da ADR (`docs/adr/README.md`). O padrão a copiar em **toda** task é `apps/web/lib/feed-data.ts`: hook que lê `isApiDataSource()`, chama `getApiClient().<modulo>.<procedimento>(...)` no modo `api` e cai no mock no modo `mock`. Tipos vêm de `@sigillus/contracts`; nunca declare tipo local.

Durante a fase 1 a suíte E2E continua rodando em modo `mock` e precisa continuar verde. O modo `api` é validado manualmente (API + Postgres + MinIO locais via `npm run db:up`) e, quando fizer sentido, com um spec novo que só roda com `NEXT_PUBLIC_DATA_SOURCE=api`. A virada da suíte inteira para `api` é a T-19.

Para validar em modo `api` localmente:

```bash
npm run db:up
cp apps/api/.env.example apps/api/.env   # ou o script de T-01
npm run db:migrate -w apps/api && npm run db:seed -w apps/api
npm run dev:api
NEXT_PUBLIC_DATA_SOURCE=api npm run dev
```

Logins de dev (seeds): `cliente@sigillus.dev` / `Cliente@123`, `profissional@sigillus.dev` / `Profissional@123`, admin `admin@sigillus.dev` / `Admin@123`.

- [x] **T-10 Catálogos e anúncio público** (passo 2). Procedimentos: `catalogs.get`, `ads.getBySlug`, `ads.listPopular`, `ads.mediaHighlights`, `ads.registerView`. Web: `app/(public)/anuncio/[slug]/page.tsx`, `components/screens/ad-details/use-ad-details.ts`, `most-viewed-screen.tsx`, `top-rated-screen.tsx`, `trending-media-screen.tsx`, `popular-links-section.tsx`, `lib/conversation-ad.ts`. Sem sessão, leitura pura. Pronto quando: as 4 telas públicas renderizam do banco no modo `api` com os dados das seeds; E2E `ad-details`, `home`, `gallery-profile-photo` verdes em mock. (PR #42, 08/10)

- [x] **T-11 Auth e sessão** (passo 3). A maior task da fase; tudo depois depende dela. (PR #43, 08/10)
  - Adicionar `better-auth` (versão pinada, a mesma da API) em `apps/web`. Criar `apps/web/lib/api/auth-client.ts` com `createAuthClient({ baseURL: getApiUrl(), basePath: "/api/auth" })` e `inferAdditionalFields` para `role`, `cpf`, `phone`, `city`, `alias`; e `admin-auth-client.ts` para `/api/admin-auth`.
  - `lib/auth-session.ts`: no modo `api`, `useAuthSession` passa a vir de `authClient.useSession()` + `auth.me` (para `plan`); `setRole` deixa de existir no modo `api`; `logout` chama `signOut`. Manter o mock intacto no modo `mock`.
  - Telas: `login-screen.tsx` (`signIn.email`), `client-signup-screen.tsx` e `professional-signup-screen.tsx` (`signUp.email` com `role` e campos extras), `admin-login-screen.tsx` (`adminAuthClient.signIn.email`), `account-screen.tsx` (dados reais). Erros do better-auth em PT-BR na tela.
  - `lib/admin-session.ts`: mesma troca para o admin.
  - `tests/helpers/auth.ts`: adicionar `loginViaApi(page, user)` que faz POST em `${API}/api/auth/sign-in/email` e injeta o cookie; os helpers atuais (`seedUserRole`, `seedAdminSession`) continuam para o modo mock.
  - Pronto quando: cadastro → login → `/conta` → logout funciona no modo `api` para cliente, profissional e admin; `proxy.ts` redireciona corretamente; E2E `auth`, `identity-signup`, `admin`, `age-gate`, `navigation` verdes em mock.

- [x] **T-12 Rascunho de anúncio** (passo 4). Procedimentos: `announcements.getMine`, `saveDraft`, `saveSection`, `publish`, `setListingStatus`, `setAvailability`, `setContact`. Web: `lib/announcement-draft.ts` (adaptador fino sobre o client mantendo compatibilidade mock), `professional-dashboard/announcement-tab.tsx`, `professional-ads-screen.tsx`, `chat-screen.tsx`, `account-screen.tsx`. Registrado via ADR-009. (PR #44, 08/10)

- [x] **T-13 Mídia** (passo 5). Procedimentos: `media.createUpload` → `PUT` direto na URL pré-assinada (único `fetch` fora do client permitido, porque é S3) → `media.completeUpload` → polling de `media.get` até `ready` ou `failed`; `listMine`, `remove`, `reorder`, `setProfileImage`. Web: `lib/announcement-media.ts` (323 linhas), `components/ui/image-cropper-modal.tsx`, `image-blur-modal.tsx`, `image-selection-utils.ts`, `lib/ad-profile-image.ts`. Limites por plano vêm de `premium.getState().limits`, não de constante local. Registrado via ADR-010. (PR #45, 08/10)

- [x] **T-14 Chat** (passo 6). Procedimentos: `chat.listConversations`, `listMessages`, `ensureConversationForAd`, `sendText`, `sendBrief`, `sendMedia`, `openViewOnce`, `markRead`, `setBlocked`, `deleteFromInbox`, `report`, `updateAlias`, `subscribe` (SSE, event iterator do oRPC). Web: `lib/chat-store.ts` mantendo a camada otimista e o `clientMessageId`, `lib/chat-service.ts` conectado ao client, `chat-screen.tsx` com carregamento reativo e formatação de timestamps, `lib/encounter-brief.ts`, `ad-details/use-contact-cta.ts`, `lib/conversation-ad.ts` com lookup assíncrono e hook `useConversationAd`. Registrado via ADR-011. (PR #47, 09/10)

- [x] **T-15 Avaliações e convites** (passo 7). Procedimentos: `reviews.listForAd`, `getInvite`, `listMyInvites`, `invite`, `withdrawInvite`, `submit`. Web: `lib/review-invites.ts` integrado via oRPC mantendo compatibilidade mock, `lib/ad-reviews.ts`, `ad-details/review-cta.tsx`, `reviews-section.tsx`, `standard-reviews-section.tsx`, `professional-dashboard/reviews-tab.tsx`, `components/ui/star-rating-input.tsx`. Regras do gate no `domain` (`review-gate.ts`). Registrado via ADR-012. (PR #48, 09/10)

- [x] **T-16 Notificações** (passo 8). Procedimentos: `notifications.list`, `markRead`, `markAllRead`, `remove`. Web: `lib/account-notifications.ts` integrado via oRPC com mutações otimistas e fallback mock, `formatRelativeTime` no domain, `notifications-center.tsx`, `notification-bell-button.tsx`. Registrado via ADR-013. (PR #49, 09/10)

- [x] **T-17 Premium** (passo 9, já no formato de lançamento gratuito). Procedimentos: `premium.getState`, `plans` (os outros dois ficam ligados mas atrás da flag da T-22). Web: `lib/premium-plan.ts` deixa de ler `localStorage` no modo API e passa a vir de `premium.getState()` (a fonte de verdade do plano é o servidor); `lib/premium-catalog.ts`, `premium-subscription-checkout-screen.tsx`, `premium-conversion-modal.tsx`, `premium-entry-banner.tsx`, `premium-entry-button.tsx`, `traffic-discovery-card.tsx`, `financial-independence-screen.tsx`. Registrado via ADR-014. (PR #50, 09/10)

- [x] **T-18 Backoffice** (passo 10). Procedimentos: todo o `admin.*`. Web: `lib/admin-service.ts` (234 linhas), `admin-dashboard-screen.tsx`, `admin-profiles-screen.tsx`, `admin-profile-detail-screen.tsx`, `admin-active-professionals-screen.tsx`, `admin-clients-screen.tsx`, `admin-reports-screen.tsx`, `admin-search.tsx`. Registrado via ADR-015. (PR #51, 09/10)

- [x] **T-19 Remover os mocks e virar a E2E para a API.** Só depois de T-10 a T-18. Apagar `lib/mock-data.ts`, `lib/mock-users.ts`, `lib/data-source.ts` (ou reduzir a `getApiUrl()`), a flag `NEXT_PUBLIC_DATA_SOURCE` em `.env.example`, README e AGENTS; `remotePatterns` de picsum/unsplash/pexels em `next.config.ts` (deixar só o host do storage). Playwright: `globalSetup` que sobe (ou assume) API + Postgres via `compose.yaml`, roda migrations e seeds, e loga pelos helpers da T-11; `.github/workflows/playwright.yml` passa a rodar em PR com Postgres e MinIO de serviço. Pronto quando: `grep -r mock-data apps/web` não retorna nada e a suíte E2E inteira passa contra a API. Registrado via ADR-016. (PR #52, 10/10)

## 5. Fase 2 — pronto para o ar (versão gratuita)

Pode intercalar com o fim da fase 1; T-20 e T-21 não dependem de nada.

- [x] **T-20 CLI `create-admin`.** `apps/api/src/cli/create-admin.ts` + script `admin:create -w apps/api`, lendo e-mail, nome e senha de argumentos ou env, reaproveitando `upsertAdminWithPassword` de `src/db/seed/users.ts`. Hoje não existe forma de criar o primeiro admin em produção (sign-up de admin é desligado e as seeds de admin não rodam com `NODE_ENV=production`). Testar que roda contra o banco de teste. (PR #53, 10/10)

- [x] **T-21 Verificação opcional por flag** (D-03). API: env `VERIFICATION_REQUIRED` (default `false`), exposto em `verification.getState` como `required: boolean` (adicionar ao schema em `contracts`). Nenhum endpoint passa a exigir verificação; a flag só informa a UI. Web: `account-screen.tsx` e `professional-dashboard-screen.tsx` mostram a seção de verificação como "opcional" quando `required=false` e escondem o botão de enviar código enquanto não houver provedor (sem provedor, `sendCode` só loga; não prometer ao usuário um código que não chega). Pronto quando: cadastro e publicação funcionam sem verificar nada, e a UI não oferece envio de código. (PR #54, 10/10)

- [x] **T-22 Premium em modo gratuito** (D-01). API: env `PREMIUM_CHECKOUT_ENABLED` (default `false`); `premium.startSubscription` responde `CONFLICT` com mensagem clara quando desligado; `premium.getState` passa a incluir `checkoutEnabled: boolean`. Web: com `checkoutEnabled=false`, esconder `premium-entry-banner`, `premium-entry-button`, a rota `/profissional/assinatura-premium` redireciona para o dashboard e o `premium-conversion-modal` não abre. Decisão pendente P-01 resolvida com opção (b): admin concede premium à mão via `admin.grantPremium`. Concluído com testes unitários, integração e E2E. (PR #55, 10/10)

- [ ] **T-23 E-mail transacional mínimo.** Depende de P-02. Sem e-mail não há "esqueci minha senha", e isso vira ticket de suporte no dia 1. Implementação: `apps/api/src/lib/mail.ts` com interface `Mailer` (`send({ to, subject, text, html })`), implementação `LogMailer` (default fora de produção) e uma real atrás de `MAIL_PROVIDER`; ligar `emailAndPassword.sendResetPassword` no better-auth do usuário; tela `/auth/esqueci-senha` e `/auth/redefinir-senha` no web. Depois, o mesmo `Mailer` vira o `VerificationNotifier` de e-mail.

- [ ] **T-24 Termos, Privacidade e exclusão de conta (LGPD).** Páginas estáticas `app/(public)/termos/page.tsx` e `app/(public)/privacidade/page.tsx` com link no rodapé e checkbox obrigatório no cadastro (texto é do Daniel; o agente só monta a estrutura). API: `auth.deleteAccount` no contrato, usando `deleteUser` do better-auth; anonimizar mensagens enviadas (`senderId` preservado, conteúdo substituído) e apagar mídia do storage. Web: botão em `account-screen.tsx` com confirmação.

- [ ] **T-25 Dockerfile do web e compose de produção.** `apps/web/Dockerfile` multi-stage usando `output: "standalone"` (já configurado) com `NEXT_PUBLIC_*` como build args. `compose.prod.yaml` na raiz (ou em `deploy/`) com `api`, `web`, `postgres`, `minio` (ou sem `minio` se for R2), volumes e healthchecks; `compose.yaml` continua só para dev. Adicionar job `docker-web` na CI ao lado do `docker-api`.

- [ ] **T-26 Deploy.** Depende de P-03. Checklist de env de produção da API (todas as chaves de `apps/api/.env.example` com valor real; `AUTH_SECRET` de 32+ bytes aleatórios; `BILLING_PROVIDER=fake` + `BILLING_FAKE_ACKNOWLEDGED=true` enquanto gratuito; `VERIFICATION_DEV_CODES=false`; `OPENAPI_DOCS_ENABLED=false`; `CORS_ORIGINS` e `WEB_ORIGIN` com o domínio real; `COOKIE_DOMAIN` com o domínio pai se web e API estiverem em subdomínios diferentes; `S3_*` do storage escolhido; `SENTRY_DSN`). Postgres com `CREATE EXTENSION pg_trgm` permitido. Em produção, migrations rodam no boot (`MIGRATE_ON_BOOT`) ou com `DATABASE_URL` explícito; nunca via `npm run db:migrate`, que completa chaves ausentes com o `.env.example`. Backup diário do Postgres e do bucket. Rodar `admin:create` (T-20). Registrar o que foi escolhido em `docs/adr/007-infra-escolhida.md`.

- [ ] **T-27 Smoke test pós-deploy.** Roteiro manual em `docs/smoke.md`: cadastro de cliente e de profissional, publicar anúncio, admin aprova, anúncio aparece no feed, cliente abre conversa, envia briefing, profissional responde, convite de avaliação, avaliação, denúncia, suspensão, logout, `/healthz` e `/readyz` 200. Executar e anotar a data.

- [ ] **T-28 Bateria de testes de estresse, resiliência e consolidação.** Ao concluir a Fase 2: executar todas as suítes de testes possíveis, testes de estresse e concorrência na API e no web (múltiplas requisições simultâneas, streaming de chat SSE concorrente, rajadas de requisições e navegações paralelas), varredura profunda de bugs/falhas e edge cases. Incorporar novos testes automatizados criados durante a Fase 2 e consolidar a suíte inteira antes da Fase 3.

## 6. Fase 3 — monetização (parada por decisão, não por falta de código)

Reabrir quando o Daniel decidir cobrar. Nada aqui bloqueia o ar.

- [ ] **T-30 Escolher PSP** que aceite o vertical, com Pix e recorrência (ADR-006 lista o risco). Registrar em ADR.
- [ ] **T-31 Implementar `BillingProvider` real** em `apps/api/src/lib/billing/<psp>-provider.ts` (`createCheckout`, `cancelSubscription`, `verifyWebhook` com a assinatura do PSP). Adicionar o nome ao enum `BILLING_PROVIDER` em `config.ts` e escolher o provedor em `server.ts`. Testes de integração com webhook assinado, como os do fake.
- [ ] **T-32 Ligar checkout na UI** (`PREMIUM_CHECKOUT_ENABLED=true`): `premium-subscription-checkout-screen.tsx` redireciona para `checkoutUrl`; tela de retorno; estado `pending_payment` e `past_due` visíveis. Preços continuam vindo de `PREMIUM_PLAN_OPTIONS`.
- [ ] **T-33 SMS para verificação de telefone** (provedor a definir) e `VERIFICATION_REQUIRED=true` se fizer sentido.
- [ ] **T-34 Moderação de mídia** em `media.moderate` (API externa ou fila de revisão humana no admin).

## 7. Decisões pendentes (perguntar ao Daniel antes de executar a task que depende)

| #    | Pergunta                                                                                                                                   | Opções                                                                                                                                                                                                              | Bloqueia   |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| P-01 | [Resolvida - Opção B] No lançamento gratuito, como funciona o premium?                                                                     | Resolvida: admin concede premium à mão via `admin.grantPremium` (T-22, PR #55).                                                                                                                                     | Resolvida  |
| P-02 | Vale adicionar um provedor de e-mail antes do ar, só para reset de senha e verificação de e-mail?                                          | Resend, Postmark, Amazon SES, Brevo (todos têm faixa gratuita ou barata). Sem isso, senha esquecida não tem solução pelo app.                                                                                       | T-23       |
| P-03 | Onde hospedar?                                                                                                                             | VPS com Docker Compose (mais barato, uma máquina com API + web + Postgres + MinIO); PaaS de container (Fly, Railway, Render) + Postgres gerenciado (Neon, Supabase) + R2; Vercel para o web + container para a API. | T-25, T-26 |
| P-04 | Domínio: web e API no mesmo domínio (ex.: `app.x.com` e `api.x.com` com `COOKIE_DOMAIN=.x.com`) ou web fazendo proxy de `/api` para a API? | Define cookie e CORS. Subdomínios é o caminho que o código já prevê.                                                                                                                                                | T-26       |
| P-05 | Texto de Termos de Uso e Política de Privacidade.                                                                                          | Daniel escreve ou aprova um rascunho.                                                                                                                                                                               | T-24       |

## 8. Mapa rápido: módulo → arquivos

| Módulo da API      | Service                               | Arquivos do web que ainda são mock                                                                                      | Task       |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| catalogs, ads      | `modules/catalogs`, `modules/ads`     | `use-ad-details.ts`, telas `popular/*`, `conversation-ad.ts`                                                            | T-10       |
| auth (better-auth) | `lib/auth.ts`, `modules/auth`         | `auth-session.ts`, `admin-session.ts`, `login-screen`, `*-signup-screen`, `admin-login-screen`, `tests/helpers/auth.ts` | T-11       |
| announcements      | `modules/announcements`               | `announcement-draft.ts`, `announcement-tab.tsx`, `professional-ads-screen.tsx`                                          | T-12       |
| media              | `modules/media` + `jobs.ts`           | `announcement-media.ts`, `ad-profile-image.ts`, croppers                                                                | T-13       |
| chat               | `modules/chat` + `lib/chat-events.ts` | `chat-store.ts`, `chat-service.ts`, `chat-screen.tsx`, `encounter-brief.ts`                                             | T-14       |
| reviews            | `modules/reviews`                     | `review-invites.ts`, `ad-reviews.ts`, `reviews-tab.tsx`                                                                 | T-15       |
| notifications      | `modules/notifications`               | `account-notifications.ts`, `notifications-center.tsx`                                                                  | T-16       |
| premium            | `modules/premium` + `lib/billing`     | `premium-plan.ts`, `premium-catalog.ts`, telas premium                                                                  | T-17, T-22 |
| admin              | `modules/admin`                       | `admin-service.ts`, `components/screens/admin/*`                                                                        | T-18       |
| verification       | `modules/verification`                | `verification.ts`, seções em `account-screen` e `professional-dashboard-screen`                                         | T-21       |

## Histórico deste arquivo

- 04/10/2026: criado a partir da análise completa da `main` (Claude). Decisões D-01 a D-08 registradas com o Daniel.
