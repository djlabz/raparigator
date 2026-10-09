# Relatório de Status da Migração, Garantia de Testes e Próximos Passos

**Data:** 08/10/2026  
**Repositório:** `djlabz/raparigator` (Sigillus)  
**Branch:** `main` (histórico linear preservado)  
**Status da Fase 1:** 5 de 10 passos concluídos (50% da Fase 1)

---

## 1. Resumo Executivo do que Foi Entregue Hoje

Na data de hoje, foram executadas, validadas e mergeadas na branch `main` 4 tasks cruciais da **Fase 1 (Migração Progressiva de Mock para API)**, todas acompanhadas de Architecture Decision Records (ADRs) e mantendo o modo dual-mode (`NEXT_PUBLIC_DATA_SOURCE=mock|api`) para que a aplicação nunca quebre em mock.

| Task     | Título                        | PR                                                   | ADR                                                                                                           | O que foi feito                                                                                                                                                                                                                                                       |
| -------- | ----------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **T-10** | Catálogos e Anúncio Público   | [#42](https://github.com/djlabz/raparigator/pull/42) | N/A                                                                                                           | Telas públicas (`/anuncio/[slug]`, `popular/*`, destaques) conectadas a `catalogs.get`, `ads.getBySlug`, `ads.listPopular`, `ads.mediaHighlights` e `ads.registerView`.                                                                                               |
| **T-11** | Auth e Sessão com Better-Auth | [#43](https://github.com/djlabz/raparigator/pull/43) | [ADR-008](file:///home/daniel/Codes/daniel/raparigator/docs/adr/008-migracao-web-dual-mode-e-autenticacao.md) | Better-auth adicionado ao web (versão pinada `1.6.29`), `auth-client.ts` e `admin-auth-client.ts`, sessões de cliente, profissional e admin conectadas às rotas reais da API, helpers de E2E adaptados.                                                               |
| **T-12** | Rascunho de Anúncio e Gestão  | [#44](https://github.com/djlabz/raparigator/pull/44) | [ADR-009](file:///home/daniel/Codes/daniel/raparigator/docs/adr/009-migracao-rascunho-de-anuncio.md)          | Hook `useMyAnnouncement` e mutações operacionais (`updateListingStatus`, `updateAvailability`, `updateContact`), persistência de rascunho por seção via `announcements.saveDraft` e `saveSection`, publicação via `announcements.publish`.                            |
| **T-13** | Mídia, Storage e Galeria      | [#45](https://github.com/djlabz/raparigator/pull/45) | [ADR-010](file:///home/daniel/Codes/daniel/raparigator/docs/adr/010-migracao-midia-e-storage.md)              | Upload pré-assinado direto para S3/MinIO via `PUT fetch`, polling de processamento/thumbnails geradas pelo worker, limites dinâmicos de plano via `premium.getState().limits` com identidade referencial estável, reordenação de capa e associação de foto de perfil. |

---

## 2. Bateria de Testes e Garantia de Qualidade

Todas as implementações foram submetidas a uma suíte exaustiva de testes cobrindo todas as camadas da aplicação:

### 2.1 Verificação Estática de Código (`npm run check`)

- **Linting (`oxlint`):** 0 erros e 0 warnings em 359 arquivos analisados.
- **Formatação (`oxfmt`):** 100% dos 395 arquivos em conformidade com o `.oxfmtrc.json`.
- **Typecheck estrito (`tsc --noEmit`):** 0 erros nos 4 workspaces:
  - `@sigillus/contracts`
  - `@sigillus/domain`
  - `@sigillus/api`
  - `@sigillus/web`

### 2.2 Testes Unitários e de Integração de Regras de Negócio (`npm run test`)

- **Pacote `@sigillus/domain` (31 testes aprovados):**
  - Regras de rascunho de anúncio (`announcement-draft.test.ts`)
  - Filtros de feed (`feed-filters.test.ts`)
  - Gates e regras de convite para avaliação (`review-gate.test.ts`)
  - Briefing de encontro (`encounter-brief.test.ts`)
  - Identidade e sanitização (`identity.test.ts`)
  - Limites e regras de plano premium (`premium.test.ts`)
- **Pacote `@sigillus/api` (94 testes de integração aprovados com Postgres real):**
  - Autenticação e isolamento de papéis (`auth.test.ts` — 5 testes)
  - Mídia, upload pré-assinado, cotas e workers (`media.test.ts` — 9 testes)
  - Chat, mensagens, bloqueios e view-once (`chat.test.ts` — 14 testes)
  - Anúncios e permissões de perfil (`announcements.test.ts` — 9 testes)
  - Catálogos e listagens públicas (`catalogs.test.ts` — 8 testes)
  - Avaliações e convites (`reviews.test.ts` — 5 testes)
  - Verificação de telefone e e-mail (`verification.test.ts` — 8 testes)
  - Notificações in-app (`notifications.test.ts` — 3 testes)
  - Reducer de eventos de assinatura (`premium-reducer.test.ts` — 10 testes)
  - Validações de configuração (`config.test.ts` — 5 testes)

### 2.3 Compilação e Build de Produção

- **`@sigillus/api` (`npm run build:api`):** build com `tsup` em 81ms gerando os bundles de produção `dist/server.js`, `dist/migrate.js` e `dist/seed.js`.
- **`@sigillus/web` (`npx next build --webpack`):** build de produção Next.js compilado com sucesso gerando todas as 26 rotas estáticas e dinâmicas da aplicação (`/`, `/anuncio/[slug]`, `/feed`, `/chat`, `/conta`, `/profissional/dashboard`, `/admin/*`, etc.).

### 2.4 Testes End-to-End (`PORT=3100 npm run test:e2e`)

- **Playwright (71 testes em Chromium, 100% aprovados):**
  - Fluxo de onboarding e landing page (`home.spec.ts`)
  - Detalhes do anúncio público (`ad-details.spec.ts`)
  - Autenticação, login e cadastro de cliente e profissional (`auth.spec.ts`, `identity-signup.spec.ts`)
  - Feed de anúncios, filtros e badges premium (`feed.spec.ts`)
  - Simulador de independência financeira e modais (`financial-independence.spec.ts`)
  - Galeria de fotos, seleção de capa e definição de foto de perfil (`gallery-profile-photo.spec.ts`)
  - Avaliação por convite entre cliente e profissional (`review-invite.spec.ts`)
  - Painel administrativo e permissões (`admin.spec.ts`)
  - Navegação mobile por abas (`navigation.spec.ts`)
  - Age-gate e verificação de maioridade (`age-gate.spec.ts`)

---

## 3. Auditoria de Regras de Produto e Diretrizes Críticas

Todas as implementações respeitam rigorosamente as diretrizes invioláveis do projeto:

1. **Vitrine pura de anúncios:** Não existe qualquer menção ou implementação de intermediação de pagamentos entre clientes e acompanhantes, custódia, taxa de serviço, agendamento de encontro ou check-in/out.
2. **Único fluxo monetário:** Apenas profissional → plataforma (assinatura premium).
3. **Contratos como fonte única de verdade:** Nenhum tipo TypeScript foi declarado em paralelo; todos residem em `@sigillus/contracts`.
4. **Regras de negócio isoladas:** Funções de cálculo de limites, score de perfil, normalização e validação residem exclusivamente em `@sigillus/domain`.
5. **Zero comentários no código:** Código limpo e autoexplicativo, com textos de interface em Português do Brasil.
6. **Dependências pinadas:** Sem operadores dinâmicos (`^`, `~`) no `package.json`.

---

## 4. Próximos Passos Propostos (Roteiro Detalhado)

Conforme acordado, **nenhuma implementação foi iniciada nesta etapa**. Quando o desenvolvimento for retomado, a sequência oficial é:

### 4.1 Task T-14: Chat (Passo 6 da Fase 1)

- **Procedimentos:** `chat.listConversations`, `listMessages`, `ensureConversationForAd`, `sendText`, `sendBrief`, `sendMedia`, `openViewOnce`, `markRead`, `setBlocked`, `deleteFromInbox`, `report`, `updateAlias`, `subscribe` (SSE via event iterator do oRPC).
- **Frontend:**
  - Adaptar `apps/web/lib/chat-store.ts` (462 linhas) mantendo a camada otimista e o `clientMessageId`.
  - Substituir o mock em `apps/web/lib/chat-service.ts` chamando o client oRPC.
  - Conectar `chat-screen.tsx`, `lib/encounter-brief.ts` e `use-contact-cta.ts`.
  - Transformar `conversation-ad.ts` em lookup assíncrono via `ads.getBySlug`.
  - O streaming via `chat.subscribe` substitui polling e reestabelece conexão com backoff em caso de queda.
- **Critério de conclusão:** Cliente abre conversa pelo anúncio, envia texto e briefing; profissional responde em tempo real e visualiza sem recarregar a tela; E2E `chat.spec.ts` e `encounter-brief.spec.ts` verdes.

### 4.2 Task T-15: Avaliações e Convites (Passo 7 da Fase 1)

- **Procedimentos:** `reviews.listForAd`, `getInvite`, `listMyInvites`, `invite`, `withdrawInvite`, `submit`.
- **Frontend:** Remover `lib/review-invites.ts` do `localStorage`, conectar `lib/ad-reviews.ts`, `review-cta.tsx`, `reviews-section.tsx` e `reviews-tab.tsx`.
- **Critério de conclusão:** Profissional convida após conversa de mão dupla, cliente avalia uma única vez, nota média atualiza no anúncio; E2E `review-invite.spec.ts` verde.

### 4.3 Task T-16: Notificações (Passo 8 da Fase 1)

- **Procedimentos:** `notifications.list`, `markRead`, `markAllRead`, `remove`.
- **Frontend:** Conectar `lib/account-notifications.ts`, `notifications-center.tsx` e `notification-bell-button.tsx`.
- **Critério de conclusão:** Notificações de aprovação/rejeição e convites de avaliação aparecem reativas na interface.

### 4.4 Tasks T-17 a T-19 (Fim da Fase 1)

- **T-17:** Assinatura Premium (integração do checkout e gestão de ciclo de vida).
- **T-18:** Backoffice Admin (moderação de anúncios, denúncias e métricas).
- **T-19:** Desligamento do mock e remoção de código morto do dual-mode.

### 4.5 Decisões Pendentes a Confirmar com o Usuário Antes das Fases 2 e 3

- **P-01 (Lançamento gratuito do Premium):** Como será concedido o status premium antes da cobrança (invisível, manual pelo admin ou padrão standard)?
- **P-02 (E-mail transacional):** Escolha do provedor de e-mail para recuperação de senha (Resend, SES, Brevo, Postmark).
- **P-03 (Infraestrutura de deploy):** Definição entre VPS com Docker Compose vs PaaS gerenciada.
- **P-04 (Domínio):** Subdomínios (`app.x.com` e `api.x.com`) vs proxy reverso.
- **P-05 (Textos legais):** Rascunho final de Termos de Uso e Política de Privacidade.
