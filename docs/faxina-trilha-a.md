# Faxina — Trilha A (PRs mecânicos, prova automática)

Sessão A da execução da Fase F. Autossuficiente para quem leu `AGENTS.md`, `CLAUDE.md`, `docs/faxina-inventario.md` (achados F-001 a F-200, decisões D-01 a D-49 com resposta) e este arquivo. A sessão B roda ao mesmo tempo com `docs/faxina-trilha-b.md`; as duas tocam o mesmo repositório, por isso as listas "exige mergeado antes" e "não rodar em paralelo com" de cada PR são a parte que mais importa.

## Protocolo de handoff (vale para as duas trilhas)

1. **Antes de começar um PR:** `git checkout main && git pull`; conferir as duas listas do PR contra o estado atual da `main` (`git log --oneline -30` e `gh pr list --state open`). Se um PR de que ele depende ainda não entrou, pular para o próximo PR liberado desta trilha e anotar na linha do PR pulado ("aguardando F-xx").
2. **Nunca dois PRs abertos da mesma sessão ao mesmo tempo.** Um PR por vez, do início ao merge.
3. **Nunca abrir um PR que esteja na lista "não rodar em paralelo com" de um PR aberto da outra trilha.** Conferir com `gh pr list --state open` e com a tabela de status das duas trilhas.
4. **Ao abrir o PR:** marcar `em andamento (#nn, dd/mm)` na coluna Status da linha dele neste arquivo (commit de docs dentro do próprio PR).
5. **Ao mergear:** marcar `[x] #nn dd/mm` na coluna Status; achados novos vão para a seção "Achados novos desta trilha" no fim deste arquivo, com data, PR de origem, arquivo:linha e proposta. Durante a execução nenhuma das duas sessões escreve em `docs/faxina-inventario.md` (as duas editando a mesma seção geram conflito); o F-22 consolida os achados das duas trilhas no inventário. Descoberta que muda um PR seguinte edita a linha desse PR aqui.
6. **Prova:** o critério de pronto é o de D-42: `npm run check` + `npm run test` + `npm run test:e2e` verdes localmente, CI verde no PR e na `main`, `--retries=0` no spec do fluxo mexido. Mais a prova específica da linha do PR.
7. **Merge:** `gh pr merge --auto --squash` só com a CI verde e as conversas do CodeRabbit resolvidas (regras do `AGENTS.md`). O repositório não tem auto-merge habilitado: o comando só merge quando os checks já terminaram.
8. **Migrations do Drizzle nunca em paralelo** (duas branches gerando `drizzle/meta/_journal.json` conflitam): F-05 (B), F-13 (A) e F-10 (B) são sequenciais entre si, nessa ordem. Única exceção: se o F-13 atrasar, o F-10 pode entrar antes dele (nunca ao mesmo tempo), com rebase do rename no F-13 e conferência do diff final de `apps/api/drizzle/meta/_journal.json` e das migrations SQL contra a `main` antes do merge do F-13 (detalhe na linha do F-10 em `docs/faxina-trilha-b.md`).
9. `AGENTS.md`, `README.md` e `docs/roteiro.md` são tocados por vários PRs (F-07, F-12, F-14, F-22 nesta trilha): editar só o trecho do próprio PR e fazer rebase antes de abrir.

## Notas sobre a alocação

Divisão mantida como o Daniel pediu. Dois PRs desta trilha mudam comportamento observável, embora com prova automática: F-03 (transações, ordem de escrita, rate limit de `ads.registerView`, `grantManual`) e F-06 por causa de F-186 (`maskEmail` da busca do admin passa a usar o formato do web, D-46). F-18 (pastas) toca quase todos os arquivos do web: é o PR de maior risco de conflito com a trilha B e por isso tem janela própria (ver a linha dele). Nomes de branch dos PRs 17, 18 e 19 do inventário foram alinhados aos números: F-17a/F-17b (cadastro), F-18 (pastas), F-19 (quebras).

## Ordem da trilha A

| Ordem | PR                                                 | Status |
| ----- | -------------------------------------------------- | ------ |
| A1    | F-02 código morto e comentários                    |        |
| A2    | F-03 bugs de regra sem decisão                     |        |
| A3    | F-06 regras puras para o domain                    |        |
| A4    | F-07 camadas da API                                |        |
| A5    | F-08 mensagens em português                        |        |
| A6    | F-09 seeds: CPF e pexels                           |        |
| A7    | F-11 CSS                                           |        |
| A8    | F-12 nomes                                         |        |
| A9    | F-13 `moderationStatus`                            |        |
| A10a  | F-14a consolidação da documentação                 |        |
| A10b  | F-14b ADRs 017 e 020 (rascunho, revisão do Daniel) |        |
| A11   | F-16 duplicação do web                             |        |
| A12   | F-18 pastas por funcionalidade (um PR por feature) |        |
| A13   | F-20 API por caso de uso                           |        |
| A14   | F-22 guardas de arquitetura na CI                  |        |

## PRs

### A1 — F-02 `chore/F-02-codigo-morto`

- **Achados:** F-003, F-004, F-005, F-006, F-007, F-009, F-010, F-011, F-014, F-016, F-031, F-033, F-035; comentários e diretivas F-017, F-018, F-019, F-021, F-022, F-023, F-024, F-028, F-029, F-030; de F-008 só `getActivityLog` e `fetchOpenViewOnce`.
- **Decisões aplicadas:** D-02 "apagar `getActivityLog` e `fetchOpenViewOnce`; ligar `stopChatEventStream` ao logout" (a ligação é do F-04, aqui a função fica); D-05 "sim: ADR curto antes de apagar os 9 comentários" (logo F-020 **não** entra aqui, fica para o F-14); D-06 "confirmado: nenhum snapshot em formato antigo é persistido; remover o ramo `isLegacy`". Fora daqui por decisão: F-001/F-002/F-012 (barrels, D-01) e F-013 (D-03) vão no F-22.
- **Arquivos:** apaga `apps/web/components/ui/{info-hint,status-badge}.tsx` e `apps/web/lib/identity-types.ts`; `.oxlintrc.json:54`; tira `export` ou apaga símbolos em `apps/web/lib/*` (`types`, `admin-service`, `chat-service`, `chat-store` (só export), `verification`, `premium-plan`, `premium-catalog`, `review-invites`, `announcement-draft`, `*-types`, `feed-filters`, `identity`, `encounter-brief`, `chrome-styles`, `conversation-ad`, `auth-return`, `auth-session`, `share-utils`, `age-gate`, `mobile-contact-fab-position`, `modal-lock`, `navigation`, `tab-navigation`, `announcement-media`), `apps/web/components/layout/header-title-flight/{use-title-flight-surface,resolve-surface,registry}.ts`, `feed-screen/feed-header-title-context.tsx`, `professional-dashboard/dashboard-header-title-context.tsx`, `earnings-simulator/earnings-simulator.tsx`, `ad-details/use-ad-details.ts`, `ui/image-selection-utils.ts`; comentários/diretivas em `ui/{pix-icon,cash-icon,contact-icons,share-profile-modal,stepper,select}.tsx`, `screens/{chat-screen,client-signup-screen}.tsx`, `ad-details/{ad-details-screen,premium-ad-details-screen,standard-ad-details-screen,sidebar-cta}.tsx`, `onboarding-screen/onboarding-screen.tsx`, `feed-screen/feed-screen.tsx`, `professional-dashboard/{professional-dashboard-screen,announcement-tab}.tsx` (só as diretivas de F-029), `admin/admin-clients-screen.tsx` (`MockClient`); API: `apps/api/src/{config,app,router}.ts`, `orpc/base.ts` (`client`, export de `withAdmin`/`AuthenticatedUser`), `lib/{jobs,chat-events,mail,storage,billing/*}.ts`, `modules/*/{service,repository,mapper,digest,evidence,jobs}.ts` (só `export`), `db/seed/{dev-data.ts,fixtures/dev-data.json}` (F-016, F-035); testes `apps/api/tests/helpers/db.ts`, `apps/web/tests/helpers/auth.ts`, `apps/web/tests/{encounter-brief,gallery-profile-photo}.spec.ts`.
- **Prova:** nada muda de comportamento. `npm run check` (o `lint` confirma que as 6 diretivas eram mortas), `npm run test`, `npm run test:e2e`. Checar com `grep -rn` cada símbolo antes de apagar.
- **Exige mergeado antes:** nada.
- **Não rodar em paralelo com:** **qualquer PR da trilha B**. É o primeiro de tudo; a trilha B só começa (F-05) depois que ele entrar. Motivo: toca `export` em quase todos os services da API e em quase todos os `lib/` do web.

### A2 — F-03 `fix/F-03-bugs-de-regra-sem-decisao`

- **Achados:** F-134, F-135, F-136, F-137, F-138, F-139, F-140, F-141, F-142; catches da API F-045, F-046, F-047, F-048.
- **Decisões aplicadas:** nenhuma pendia. Todas as correções têm a forma descrita na linha do achado (transação, ordem de escrita, `onConflictDoNothing`, `setWhere`, rate limit por IP+slug, assinatura manual própria em `grantManual`, log nos `.catch`).
- **Arquivos:** `apps/api/src/modules/{ads/{service,router}.ts, media/{service,jobs}.ts, admin/service.ts (removeMediaByReport, grantPremium), identity/{service,repository}.ts, announcements/service.ts (publish em transação; ensureProfile/uniqueSlug), reports/service.ts (ordem presign/insert), reviews/service.ts (setWhere), premium/service.ts (grantManual)}`, `apps/api/src/orpc/{context.ts (log em getSession),base.ts (rateLimited em ads.view)}`, `apps/api/src/lib/{jobs,storage,chat-events}.ts`; testes novos em `apps/api/tests/{admin,media,reports,identity,announcements,reviews,premium,feed,storage}.test.ts`.
- **Prova:** um teste de integração novo por bug, vermelho antes (cenários na seção "Cenários do tema 7" do inventário); `feed.test.ts:79` continua esperando o incremento na 1ª view; suíte completa.
- **Exige mergeado antes:** F-02.
- **Não rodar em paralelo com:** F-05 (B: `admin/service.ts`, `announcements/service.ts`, `profiles/repository.ts`), F-10 (B: `media/jobs.ts`, `media/service.ts`). F-21 (B) não tem arquivo em comum e pode correr junto.

### A3 — F-06 `refactor/F-06-regras-puras-para-domain`

- **Achados:** F-064, F-065, F-066, F-067, F-070, F-034, F-106, F-187, F-188, F-191, F-192, F-193, F-194, F-197; com decisão: F-186, F-068, F-069.
- **Decisões aplicadas:** D-14 "admin usa o mesmo `formatRelativeTime` do chat; apagar os dois `timeAgo`"; D-15 "sim: `timeZone` `America/Sao_Paulo` fixo no web e na API (`formatDateBR` único no domain)"; D-46 "`maskEmail` no formato do web (3 chars + asteriscos + domínio), no domain com teste"; D-07 "preço fica no domain" (F-187 move o reducer, não toca `PREMIUM_PLAN_OPTIONS`); D-47 "prazos de retenção viram constantes em `domain/retention.ts` (`IDENTITY_FILES_RETENTION_DAYS` continua sobrescritível por env)" — entra aqui o `retention.ts`; D-48 "(b) manter `matchesFeedCriteria`/`filterAds`/`feedRelevanceScore` como especificação executável, com teste de equivalência contra o `feed.list` em `feed.test.ts`" — o teste de equivalência entra aqui (F-196).
- **Arquivos:** `packages/domain/src/{format.ts, identity.ts (maskEmail), announcement-draft.ts (hair, createLocationId, máscaras), premium.ts (gates com papel), subscription.ts (novo, reducer), media.ts (novo), ad-slug.ts (novo), report-status.ts (novo), identity-verification.ts (novo), retention.ts (novo), share-links.ts, navigation-roles.ts, auth-error-messages.ts, notification-links.ts, redirect.ts, fab-geometry.ts, index.ts}` + `packages/domain/tests/*`; `packages/contracts/src/schemas/{reports.ts (rótulos de motivo), common.ts (SlugSchema usa o pattern)}`; API: `modules/{admin/service.ts (maskEmail, splitCityState, isReportOpen), announcements/service.ts (hair, slugify), premium/{service,reducer}.ts (reducer sai), identity/service.ts (gate), media/service.ts (catálogo), reports/{service,digest}.ts, chat/service.ts (gates), access-log/service.ts (retention)}`, `apps/api/tests/premium-reducer.test.ts` (move para o domain), `apps/api/tests/feed.test.ts` (equivalência); web: `lib/{utils.ts (currency sai), share-utils.ts, navigation.ts, auth-errors.ts, account-notifications.ts, auth-return.ts, mobile-contact-fab-position.ts}`, `components/screens/{admin/{admin-clients,admin-dashboard,admin-reports,admin-profiles,admin-profile-detail,admin-identity-queue}-screen.tsx, identity-verification-screen.tsx, onboarding-screen/onboarding-screen.tsx (normalize), professional-dashboard/{announcement-tab.tsx (hair, createLocationId, máscaras, isVideoSrc), professional-dashboard-screen.tsx (fallbackAd)}, premium-subscription-checkout-screen.tsx (máscaras de cartão)}`, `app/(public)/denuncia/report-form.tsx` (rótulos, slug), os 11 componentes que usam `currency`; `apps/api/src/db/seed/catalogs.ts` (normalize).
- **Prova:** Vitest novo no domain para cada função movida (entrada/saída iguais às atuais); `no-pricing-without-flag.spec.ts`; `announcements`, `media`, `reports`, `identity`, `premium`, `admin` (busca mascarada: ajustar o assert ao formato novo) `.test.ts`; `feed.test.ts` com o teste de equivalência.
- **Exige mergeado antes:** F-02, F-03.
- **Não rodar em paralelo com:** F-05 (B: `admin/service.ts`, `announcements/service.ts`, telas admin), F-04 (B: `account-notifications.ts`), F-19 (B: `announcement-tab.tsx`, `admin-reports-screen.tsx`, `professional-dashboard-screen.tsx`, checkout), F-10 (B: `media/service.ts`).

### A4 — F-07 `refactor/F-07-camadas-da-api`

- **Achados:** F-177, F-180, F-181, F-184, F-198, F-052, F-071, F-179, F-183.
- **Decisões aplicadas:** D-34 "`profiles` = kernel compartilhado declarado (regra no depcruise e no AGENTS); pasta não muda; sem service" — aqui entra só a nota no `AGENTS.md` (a regra do depcruise é do F-22); D-44 "sim: P-26 (401 sem sessão, 403 logado não-admin) vale para todas as rotas `admin.*`; `withAdmin` adota e `identity/router.ts` usa o middleware comum".
- **Arquivos:** `apps/api/src/lib/{http.ts (novo), image.ts (novo)}`, `orpc/{context.ts, base.ts (withAdmin P-26, withAccessLog)}`, `app.ts`, `services.ts` (injeção de repos no admin, `blockedHashes` no media/jobs, deps obrigatórias), `modules/{access-log/service.ts, admin/{router,service}.ts, media/{jobs,router}.ts, identity/{service,router,digest}.ts, reports/{service,evidence,digest}.ts, announcements/{router,service,review-digest}.ts, chat/router.ts, auth/router.ts (só o bloco recordAccess)}`, `AGENTS.md` (parágrafo do kernel); testes `access-log`, `admin`, `identity` (401/403), `reports`, `report-evidence`, `media`, `announcements`.
- **Prova:** suíte da API; depcruise com a config da auditoria (`scratchpad` não existe mais: recriar a partir da seção "Regras de camada" do inventário) devolvendo 0 ciclos e 0 avisos `lib → modules`; `access-log.test.ts` (IP via `x-forwarded-for` e os 5 eventos).
- **Exige mergeado antes:** F-02, F-03, F-06 (ambos mexem em `admin/service.ts` e `identity/service.ts`).
- **Não rodar em paralelo com:** F-05 (B: `admin/service.ts`, `announcements/service.ts`, `orpc/base.ts`), F-21 (B: `lib/auth.ts`, `auth/router.ts`, `services.ts`), F-10 (B: `media/jobs.ts`).

### A5 — F-08 `fix/F-08-mensagens-em-portugues`

- **Achados:** F-156, F-157, F-158, F-159, F-160, F-161.
- **Decisões aplicadas:** D-37 "texto `Dados inválidos. Confira os campos.` + `data.issues` traduzidos (locale pt do Zod)".
- **Arquivos:** `apps/api/src/lib/zod.ts` (novo, `z.config(z.locales.pt())`), `apps/api/src/{server.ts ou config.ts (import antes de contracts), app.ts (interceptor), orpc/base.ts (message nas 3 linhas)}`; `packages/contracts/src/{router.ts, schemas/{reports,reviews,user,identity-verification,announcement-media}.ts}` (mensagens dos ~20 campos digitados); web: `lib/api/{errors.ts (novo), client.ts}`, `lib/{auth-errors.ts (mapa por code; depois do F-06 ele está em `domain/auth-error-messages.ts`), feed-data.ts, ad-data.ts, announcement-draft.ts}`, `components/screens/{account-screen.tsx, identity-verification-screen.tsx, admin/admin-identity-queue-screen.tsx}`, `app/layout.tsx` ou `lib/api/client.ts` (locale pt no web também).
- **Prova:** `grep -rn "Input validation failed\|Unauthorized\|Forbidden" apps/api/tests` ajustado; E2E de auth, denúncia (`admin-reports.spec.ts`, formulário `/denuncia`), identidade; teste de `loadConfig({})` com texto PT-BR.
- **Exige mergeado antes:** F-02, F-06 (move `auth-errors`), F-07 (mexe em `orpc/base.ts`).
- **Não rodar em paralelo com:** F-04 (B: `ad-data.ts`, `account-screen.tsx`), F-19 (B: `account-screen.tsx`, `lib/announcement-draft.ts`), F-05 (B: `orpc/base.ts`).

### A6 — F-09 `fix/F-09-seeds-cpf-e-pexels`

- **Achados:** F-164, F-165 (só pexels).
- **Decisões aplicadas:** D-38 "plano completo da seed com mídia real aprovado: seed real → destaques como assets → migration removendo `external*` → remoção dos hosts externos" — aqui entra só o que não depende do plano (CPFs e pexels); unsplash sai no F-10 (B).
- **Arquivos:** `apps/api/src/db/seed/{users.ts, fixtures/dev-data.json}` (CPFs válidos gerados com `cpfCheckDigit`), teste novo da seed (`apps/api/tests/seed.test.ts`, `isValidCpf` em todos), `apps/web/next.config.ts:22` (pexels), `apps/web/lib/next-config.test.ts`.
- **Prova:** `npm run db:seed` + E2E inteira; `next-config.test.ts`; teste da seed.
- **Exige mergeado antes:** F-02 (F-016 limpa o JSON).
- **Não rodar em paralelo com:** F-10 (B: mesmos arquivos). F-10 exige este mergeado antes.

### A7 — F-11 `style/F-11-css`

- **Achados:** F-108, F-112, F-113, F-114, F-115, F-116, F-118; com decisão: F-109, F-110, F-111, F-117.
- **Decisões aplicadas:** D-24 "manter scrollbar oculta globalmente, mas numa regra só; apagar `.no-scrollbar`, `.modal-scroll` e classes redundantes"; D-25 "fundo oficial `#fafafa` (alinhar a skill ao CSS); `#800020`/`#96001e` viram `wine-800`/`wine-900`"; D-26 "converter o CSS Module do onboarding para utilitários Tailwind; arquivo some".
- **Arquivos:** `apps/web/app/globals.css` (tokens `--color-gold*`, `--color-premium-*`, `--color-whatsapp`, `--color-telegram`, `--color-success`, `--animate-*`, uma regra de scrollbar, remoção de 7 classes mortas e das seções 67-72/132-138/275-288), `onboarding-screen/onboarding-screen.{tsx,module.css (apaga)}`, `ui/{modal,premium-conversion-modal,contact-icons,shiny-button,premium-entry-banner,premium-entry-button}.tsx`, substituição de hex e classes no-op em `premium-subscription-checkout-screen.tsx`, `ad-details/{premium-hero-section,sidebar-cta,standard-sidebar-cta,scheduling-simulator,standard-scheduling-simulator,about-section,photo-gallery-section}.tsx`, `ui/share-profile-modal.tsx`, `professional-dashboard/{announcement-tab.tsx (4 `<style jsx>`, 10 hex, `hide-scrollbar`, `pb-safe`), professional-dashboard-screen.tsx (`scrollbar-none`)}`, `feed-screen/{feed-ad-card,feed-filters-content}.tsx`, `professional-ads-screen.tsx` (perspective), `client-signup-screen.tsx` e `professional-signup-screen/professional-signup-screen.tsx` (`animate-in`), `.agents/skills/brand-guidelines/SKILL.md` (fundo).
- **Prova:** checagem visual nas telas premium, home (3 breakpoints), cadastro (shake), chat, modais, `/profissional/anuncios`; `identity-signup.spec.ts`, `home.spec.ts`, `age-gate.spec.ts`, `feed-filters-layout.spec.ts`; `refine-motion` onde houver keyframe migrado.
- **Exige mergeado antes:** F-02.
- **Não rodar em paralelo com:** F-15 (B: todos os `ad-details/*` premium e standard), F-19 (B: `announcement-tab.tsx`, `feed-ad-card.tsx`, `professional-dashboard-screen.tsx`, checkout), F-17 (B: as duas telas de cadastro). Se a B estiver num desses, fazer o F-11 em duas partes: `globals.css` + `ui/*` + onboarding primeiro, substituição de hex nos arquivos da B depois que o PR dela entrar.

### A8 — F-12 `refactor/F-12-nomes`

- **Achados:** F-144, F-145, F-146, F-147, F-148, F-150, F-151, F-153, F-154; F-155 só quando o T-69 rodar; F-152 cai se o F-15 (B) unificar as variantes antes (conferir).
- **Decisões aplicadas:** D-32 "renomear símbolos, módulo, store e namespace do contrato para `contactVerification` (paths `/contact-verification/*`); tabela `verification_channel` fica"; D-33 "rótulos `Confirmar e-mail e telefone` × `Verificação de identidade` agora, no PR de nomes; rota `/profissional/anuncios/verificacao` fica"; D-35 "aprovada a convenção (`*Mine`; `set*` valor único / `update*` objeto parcial; `remove`); texto no `AGENTS.md` e os 4 renames (`listInvites`, `updateContact`, `setAlias`, …) no PR de nomes"; D-36 "`encounter-brief` → `simulation-brief` só na passada do T-69" (não entra); D-08 "manter `admin-service.ts` como camada" (não renomear).
- **Arquivos:** `packages/contracts/src/{schemas/identity.ts → contact-verification.ts + signup-form.ts, index.ts, router.ts (namespace, paths, 4 procedimentos)}`; `packages/domain/src/{identity.ts → signup-form.ts, index.ts}` + testes; API: `modules/verification/* → modules/contact-verification/*`, `services.ts`, `router.ts`, `lib/rate-limit.ts`, `db/schema/social.ts` → `{reviews,notifications,contact-verification,billing}.ts` (F-148, sem migration), `apps/api/tests/verification.test.ts`; web: `lib/{verification.ts → contact-verification.ts, identity.ts → signup-validation.ts, premium-plan.ts → premium-state.ts, premium-catalog.ts, feed-data.ts → feed-api.ts, ad-data.ts → ads-api.ts, data-source.ts (some: `getApiUrl`em`lib/api/client.ts`), chat-service.ts → chat-api.ts, review-invites.ts (um par de nomes), account-notifications.ts → notifications.ts, popular-sections.ts → popular-links.ts, announcement-draft.ts (`updateContact`), chat-store.ts (`setAlias`)}`, `components/screens/professional-dashboard/professional-dashboard-screen.tsx` (`ContactVerificationTab` + rótulo), `account-screen.tsx`, `client-signup-screen.tsx`, `ui/input.tsx`, `layout/notifications-center.tsx`, `screens/popular-links-section.tsx`, todos os importadores dos renomeados; `AGENTS.md` (convenção de procedimentos).
- **Prova:** `npm run typecheck` pega todo rename; `verification.test.ts`; E2E do painel (`identity-verification.spec.ts`), conta (`account-alias.spec.ts`), cadastro; diff do `/api/openapi.json` só nos paths renomeados.
- **Exige mergeado antes:** F-02, F-06, F-08 (os três tocam os mesmos `lib/`).
- **Não rodar em paralelo com:** F-04 (B: `premium-plan`, `review-invites`, `verification`, `account-notifications`, `chat-store`), F-19 (B: `professional-dashboard-screen.tsx`, `account-screen.tsx`, `lib/announcement-draft.ts`, chat), F-15 (B: só se F-152 entrar), F-21 (B: `services.ts`). Janela recomendada: enquanto a B está no F-10 (seeds, só API/seed).

### A9 — F-13 `refactor/F-13-moderation-status`

- **Achados:** F-143.
- **Decisões aplicadas:** D-31 "`moderationStatus` (coluna `moderation_status`, `ModerationStatusSchema`) com migration `RENAME COLUMN`; junto com o enum `draft` (D-28)". O enum `draft` é criado pelo F-05 (B); este PR só renomeia.
- **Arquivos:** `apps/api/src/db/schema/profiles.ts` + migration gerada (`npm run db:generate -w apps/api`, só `ALTER TABLE … RENAME COLUMN`); `packages/contracts/src/schemas/{common.ts, ad.ts}`, `router.ts:444`; os 14 arquivos de src com `verificationStatus` (`admin/service.ts`, `profiles/repository.ts`, `announcements/service.ts`, `ads/service.ts`, `chat/service.ts`, `reviews/service.ts`, `announcements/review-digest.ts`, `profiles/mapper.ts`, `db/seed/dev-data.ts`, web `lib/types.ts`, `lib/admin-service.ts`, `admin-profiles-screen.tsx`, `admin-profile-detail-screen.tsx`, `professional-dashboard-screen.tsx`), `packages/domain/src/profile-moderation.ts` (criado pelo F-05), 6 testes da API, 1 E2E.
- **Prova:** diff do `db:generate` só com o rename; `npm run test` (admin, announcements, reports, identity); `identity-verification.spec.ts`, telas admin.
- **Exige mergeado antes:** F-05 (B), F-06, F-07 (ambos tocam `admin/service.ts`).
- **Não rodar em paralelo com:** F-10 (B: migration + `schema/profiles.ts`), F-19 (B: `professional-dashboard-screen.tsx`). F-21 (B) não tem arquivo em comum e pode correr junto.

### A10 — F-14 `docs/F-14-consolidacao-docs`

- **Achados:** F-167, F-168, F-169, F-170, F-171, F-172, F-173, F-174, F-175, F-176, e o ADR curto de F-020 (D-05).
- **Decisões aplicadas:** D-39 "mover ADR 009/012/013/015, relatórios e plano superpowers para `docs/historico/`; fundir decisões perenes de 008/010/011/014 em 016; 008-015 viram stubs `fundido em 016`"; D-40 "(a) reescrever a frase do ADR-003: forma é Zod no contrato; validação cruzada e de negócio é função pura do domain chamada pelo service"; D-41 "próxima fase do roteiro = Fase F (faxina) apontando para `docs/faxina-inventario.md` e seus 22 PRs; GEMINI aponta para o roteiro"; D-42 "critério de pronto único no AGENTS: check + test + E2E local, CI verde no PR e na main, `--retries=0` no spec do fluxo mexido; os outros arquivos referenciam"; D-43 "os cinco ADRs novos (017 a 021); Claude redige rascunhos, Daniel revisa 017 e 020 antes do merge"; D-05 "ADR curto (pode entrar na subseção do chat do ADR consolidado 016) antes de apagar os 9 comentários" — depois deste PR entrar, apagar os comentários de F-020 (pode ser um commit no PR seguinte desta trilha).
- **Arquivos:** `docs/adr/{README,003,005,007,008..016}.md`, `docs/adr/{017..021}-*.md` (novos), `docs/historico/**` (novo), `docs/operacao/{deploy,smoke}.md` (mover), `docs/roteiro.md`, `docs/correcoes-pre-deploy.md` (links), `AGENTS.md` (critério de pronto, bloco Merge/CodeRabbit único, porta 3100), `CLAUDE.md`, `GEMINI.md`, `README.md`. **Dois PRs, cada um com linha própria na tabela de ordem:** 14a (A10a) com tudo menos 017 e 020; 14b (A10b) com 017 e 020 em rascunho para o Daniel revisar. O 14b fica `aguardando revisão do Daniel` na coluna Status até ele aprovar e só então é mergeado; o 14a não espera o 14b.
- **Prova:** CI verde; `grep -rn "isApiDataSource\|NEXT_PUBLIC_DATA_SOURCE\|middleware.ts" docs README.md AGENTS.md GEMINI.md` vazio fora de `docs/historico/`; links relativos conferidos (`grep -rn "file://" docs` vazio).
- **Exige mergeado antes:** F-07 e F-12 (os dois escrevem no `AGENTS.md`; fazer este depois evita conflito de texto).
- **Não rodar em paralelo com:** nenhum PR de código; só com o F-22 (A, `AGENTS.md`/`README.md`), que vem depois.

### A11 — F-16 `refactor/F-16-duplicacao-web`

- **Achados:** F-058, F-059, F-060, F-061, F-063, F-074, F-075, F-076, F-077, F-078, F-079, F-094, F-096, F-119, F-091.
- **Decisões aplicadas:** D-23 "apagar todos os re-exports finos de `lib/` e importar direto de `@sigillus/*`" (entra aqui, antes das pastas); D-16 só o que é folha: `chat-store.test.ts` criado **antes** de F-074.
- **Arquivos:** `components/layout/{bottom-nav,desktop-nav,account-menu,guest-auth-controls,notification-bell-button}.tsx` + hooks novos `use-nav-indicator.ts`, `use-nav-badges.ts`, `use-anchored-popover.ts`; `header-title-flight/{use-header-title-scroll.ts, use-title-flight-values.ts}` (novos) + `feed-screen/use-feed-section-title-scroll.ts`, `professional-dashboard/use-dashboard-title-scroll.ts`, `feed-mobile-title-flight.tsx`, `dashboard-mobile-title-flight.tsx`, `feed-mobile-heading-row.tsx`, `dashboard-heading.tsx`; `components/screens/admin/ui/{filter-tabs,suspend-modal,admin-dialog,admin-toast,admin-search-input,admin-empty-state}.tsx` (novos) e as 4 telas admin que os usam; `ui/{eyebrow,spinner,media-hover-overlay,field-error,floating-label}.tsx` (novos), `ui/{input,select,premium-conversion-modal}.tsx`; `ad-details/photo-gallery-section.tsx`; `feed-screen/{feed-location-modal,feed-filters-content,feed-ad-card}.tsx` (só os blocos repetidos); `account-screen.tsx` (só o card repetido); `app/(public)/{termos,privacidade}/page.tsx` + `layout/legal-page-layout.tsx`; `screens/{forgot-password,reset-password,login}-screen.tsx` + `lib/auth/use-auth-action.ts`, `ui/password-field.tsx`; `lib/chat-store.ts` (+ `lib/chat-store.test.ts`, `sendOptimistic`/`mutateOptimistic`); `lib/{age-gate,verification (já `contact-verification`),account-notifications (já `notifications`),premium-state,encounter-brief,auth-return}.ts` com `createExternalStore`/`safeStorage` (`lib/external-store.ts`, `lib/safe-storage.ts` novos); remoção dos re-exports `lib/{types,*-types,identity (já `signup-validation`),feed-filters,ad-profile-image}.ts` e sed nos importadores; fixtures de teste (`apps/web/tests/{helpers/auth.ts,identity-verification.spec.ts}`, `apps/api/tests/{helpers/drafts.ts,media.test.ts}`).
- **Prova:** `chat-store.test.ts`; `refine-motion` para F-060 e F-063 (indicador dos navs e title flight nas duas abas, mobile e desktop); `admin.spec.ts`, `admin-reports.spec.ts`, E2E de auth, `feed-filters-layout.spec.ts`.
- **Exige mergeado antes:** F-02, F-11, F-12 (nomes dos `lib/`), F-04 (B: `chat-store.ts`, stores), F-05 (B: telas admin).
- **Não rodar em paralelo com:** F-19 (B: `account-screen.tsx`, `feed-ad-card.tsx`, `admin-reports-screen.tsx`, `chat-screen.tsx`/`chat-store.ts`), F-17 (B: `login-screen.tsx` e cadastros usam `AuthHeroMobile`). F-15 (B) pode correr junto: `photo-gallery-section.tsx` está na mesma pasta, mas os arquivos são diferentes (cuidado no rebase). Dividir em 3 PRs se a B estiver ocupada: 16a layout/nav/popover/title-flight; 16b admin ui + legal + auth; 16c chat-store + stores + re-exports.

### A12 — F-18 `refactor/F-18-pastas-<feature>` (um PR por feature)

- **Achados:** F-103, F-104, F-105 (já feito no F-16), F-107.
- **Decisões aplicadas:** D-22 "(A) `components/screens/<feature>/` + `lib/<feature>/`, um PR por feature"; D-23 já aplicada no F-16.
- **Arquivos:** árvore-alvo na seção "Estrutura-alvo de pastas" do inventário. Sub-PRs, nesta ordem: 18-home (onboarding, age-gate, popular-links + `lib/shell/`), 18-popular, 18-auth (telas + `lib/auth/`), 18-admin (`lib/admin/`), 18-feed (`feed-screen/` → `feed/` + `lib/feed/`), 18-ads (`lib/ads/`), 18-premium, 18-account (`lib/account/`), 18-chat (`chat-screen.tsx` + `lib/chat/`), 18-dashboard (`professional-dashboard/` → `dashboard/` + `lib/announcement/`), 18-professional. Cada um: `git mv`, imports (`app/**/page.tsx` importa cada tela 1×), `.oxlintrc.json` (overrides por caminho), `apps/web/vitest.config.ts` (não muda na opção A), `AGENTS.md` (seção "Estrutura do web").
- **Prova:** só caminhos: `npm run typecheck` + `npm run lint` + E2E inteira por sub-PR.
- **Exige mergeado antes:** F-16 (re-exports já apagados), F-12 (nomes finais dos `lib/`).
- **Não rodar em paralelo com:** **qualquer PR da B que toque a feature sendo movida.** Regra prática: 18-chat só depois que a B fechar o passo de chat do F-19 e o F-04; 18-dashboard só depois dos passos de `announcement-tab` do F-19; 18-auth só depois do F-17; 18-account só depois do passo `account-screen` do F-19; 18-ads/ad-details só depois do F-15. Os sub-PRs cujas features a B não está tocando (home, popular, admin, feed, premium, professional) podem ir a qualquer momento. Conferir `gh pr list --state open` antes de cada um.

### A13 — F-20 `refactor/F-20-api-por-caso-de-uso`

- **Achados:** F-098, F-099, F-100, F-101, F-189, F-185.
- **Decisões aplicadas:** D-45 "repository obrigatório nos módulos grandes (extrair em premium, reviews, admin, verification); opcional nos pequenos (catalogs, ads, notifications); AGENTS ajustado"; D-16 (árvores da API da seção "Propostas de quebra": `admin/services/*`, `chat/services/*`, `contract/*`, `domain/announcement/*`).
- **Arquivos:** `apps/api/src/modules/admin/{service.ts, services/{shared,dashboard,clients,professionals,reports,search}.ts, repository.ts (novo)}`, `modules/chat/{service.ts, services/{conversations,messages,context}.ts, event-stream.ts}`, `modules/{premium,reviews,contact-verification}/repository.ts` (novos) e seus services, `modules/announcements/service.ts` (`draftToProfileFields` do domain), `packages/domain/src/announcement-draft.ts` → `announcement/{labels,defaults,initial-state,score,validation,pricing}.ts` + `index.ts` (+ `draftToProfileFields`), `packages/contracts/src/router.ts` → `contract/{base,auth,…,admin}.ts`, `packages/contracts/src/schemas/ad.ts` (`ProfileFields` se necessário), `AGENTS.md` (regra do repository); testes `admin`, `chat`, `stress-concurrency`, `premium`, `reviews`, `contact-verification`, `announcements`, `contracts-no-user-name`, `packages/domain/tests/announcement-draft.test.ts`.
- **Prova:** suíte da API; diff de `/api/openapi.json` vazio para F-100 (gerar antes e depois com a API rodando); `packages/domain` tests; tipos de retorno dos services inalterados (router intocado).
- **Exige mergeado antes:** F-03, F-05 (B), F-06, F-07, F-08, F-12, F-13 (todos tocam `admin/service.ts`, `announcements/service.ts` ou `router.ts`).
- **Não rodar em paralelo com:** F-21 (B: `services.ts`, `modules/auth/*`), F-10 (B: `announcements/service.ts`, `ads/service.ts`), F-19 passo `announcement-tab` com o proxy do Nominatim (B: módulo novo `geo` no `router.ts` do contrato).

### A14 — F-22 `ci/F-22-guardas-de-arquitetura`

- **Achados:** F-001, F-002, F-012, F-013, F-015, F-200, `knip.json` mínimo.
- **Decisões aplicadas:** D-01 "(B) abolir barrels: apagar os 11 `index.ts` e deep-importar sempre"; D-03 "(A) apagar `header-title-flight/index.ts`; `registry-facade.ts` fica com os 6 nomes usados"; D-04 "manter `test:e2e:ui`, `test:e2e:report`, `db:studio`, `lint:fix` com uma linha no README; apagar `check:prod-env` e os três `start`"; D-49 "`dependency-cruiser` e `knip` como devDependencies pinadas na raiz, com `lint:deps` e `knip` no job de lint da CI"; D-34 (regra do kernel `profiles` no depcruise).
- **Arquivos:** apaga `apps/api/src/modules/*/index.ts` (11) e `apps/web/components/layout/header-title-flight/index.ts`; imports em `apps/api/src/server.ts`, `apps/api/tests/**`, nos 2 hooks de scroll (já em `header-title-flight/` após F-16) e `registry-facade.ts`; `package.json` (raiz: scripts, devDependencies pinadas), `apps/web/package.json`, `apps/api/package.json` (`start`), `package-lock.json`; `.dependency-cruiser.cjs` (novo, 10 regras API + 6 web da seção "Regras de camada"; as que ainda têm violação entram como `warn`), `knip.json` (novo: `ignore: [".agents/**"]`, `ignoreDependencies: ["pino-pretty"]` em `apps/api`), `.github/workflows/ci.yml` (passo `lint:deps` e `knip` no job "Lint, format e typecheck" — **não** renomear o job, o ruleset depende do nome), `README.md` (scripts de dev), `AGENTS.md` (`lint:deps` na verificação típica); `docs/faxina-inventario.md` (nova seção "Achados novos" consolidando as seções "Achados novos desta trilha" de `docs/faxina-trilha-a.md` e `docs/faxina-trilha-b.md`).
- **Prova:** `npm run lint:deps` e `npx knip` verdes localmente e na CI; `npm run typecheck`; nenhum comportamento muda. Rodar o depcruise com `--output-type err-long` e colar o resultado no PR.
- **Exige mergeado antes:** **todos os outros PRs das duas trilhas** (é o último: as regras `error` só passam com F-07, F-18, F-21 e F-19 fechados; se algum atrasar, entrar com a regra correspondente em `warn` e anotar).
- **Não rodar em paralelo com:** F-21 (B: imports de `modules/auth/*` e `services.ts`), F-14 (A, já mergeado nessa altura).

## Mapa rápido de conflitos com a trilha B

| PR da A | Conflita com (B)        | Janela boa                                                  |
| ------- | ----------------------- | ----------------------------------------------------------- |
| F-02    | todos                   | antes de a B começar                                        |
| F-03    | F-05, F-10              | enquanto a B está no F-04 ou F-15                           |
| F-06    | F-05, F-04, F-19, F-10  | enquanto a B está no F-15, F-21 ou F-17                     |
| F-07    | F-05, F-21, F-10        | enquanto a B está no F-04, F-15, F-19, F-17                 |
| F-08    | F-04, F-05, F-19        | enquanto a B está no F-10, F-15, F-21, F-17                 |
| F-09    | F-10                    | qualquer momento antes do F-10                              |
| F-11    | F-15, F-19, F-17        | enquanto a B está no F-05, F-04, F-10, F-21                 |
| F-12    | F-04, F-19, F-15, F-21  | enquanto a B está no F-10                                   |
| F-13    | F-10, F-19              | depois do F-05, enquanto a B está no F-04, F-15, F-21, F-17 |
| F-14a   | nenhum                  | qualquer momento depois de F-07 e F-12                      |
| F-14b   | nenhum                  | depois do F-14a, merge só com a revisão do Daniel           |
| F-16    | F-19, F-17              | enquanto a B está no F-10, F-15, F-21                       |
| F-18    | por feature (ver linha) | janelas por feature                                         |
| F-20    | F-21, F-10, F-19 (geo)  | enquanto a B está no F-15 ou F-17                           |
| F-22    | F-21                    | último de todos                                             |

## Achados novos desta trilha

Formato: data, PR de origem, arquivo:linha, achado e proposta. Consolidados no inventário pelo F-22.

_Nenhum ainda._
