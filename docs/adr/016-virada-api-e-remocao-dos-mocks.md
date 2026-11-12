# ADR-016 — Web consome só a API

- Status: aceito (2026-10-09); consolidado em 2026-11-12 com as decisões que continuam valendo dos ADRs 008, 010, 011, 012, 013 e 014

## Contexto

Entre 08 e 10/10/2026 (tasks T-10 a T-19) o `apps/web` saiu dos mocks locais (`mock-data.ts`, `mock-users.ts`, `localStorage`) para a API, um módulo por PR, com uma flag `NEXT_PUBLIC_DATA_SOURCE=mock|api`. Os ADRs 008 a 015 registraram cada passo. A T-19 (PR #52) apagou os mocks e virou a E2E para a API; a T-47 (PR #71) apagou os ramos dual-mode que tinham sobrado atrás de `isApiDataSource()`. Os textos originais estão em `docs/historico/adr/`.

## Decisão

O web fala só com a API, pelo client oRPC tipado (`apps/web/lib/api/client.ts`, `getApiClient()`) e pelos clients do better-auth. Não existe modo `mock` nem `isApiDataSource()`; a E2E roda contra a API, o Postgres e o MinIO reais, com as seeds de `apps/api/src/db/seed/`.

### Autenticação no web (de 008)

- Dois clients do better-auth, com a mesma versão pinada da API: `lib/api/auth-client.ts` (`/api/auth`, cliente e profissional, `credentials: "include"`, `inferAdditionalFields` para os campos extras do usuário) e `lib/api/admin-auth-client.ts` (`/api/admin-auth`, backoffice). O porquê das duas instâncias está no ADR-019.
- `useAuthSession` (`lib/auth-session.ts`) combina a sessão do better-auth com `auth.me` para os dados que só o banco resolve (como o plano). `useAdminSession` (`lib/admin-session.ts`) faz o mesmo para o admin.
- Erros do better-auth viram texto em PT-BR por `translateAuthError` (regra pura no `domain`).
- A E2E autentica pela API (helpers em `apps/web/tests/helpers/auth.ts`) e injeta os cookies de sessão no contexto do Playwright.

### Mídia (de 010)

- Upload em três passos: `media.createUpload` (cria o registro e devolve a URL pré-assinada; o limite do plano é checado aqui e estoura `PLAN_LIMIT`), `PUT` do arquivo direto no storage e `media.completeUpload` (confere o arquivo e enfileira `media.process`). O web acompanha o processamento por `media.get` até `ready` ou `failed`.
- O `PUT` na URL pré-assinada é o único `fetch` fora do client oRPC permitido no web.
- Os limites de foto e vídeo vêm do servidor (`premium.getState().limits`), nunca de constante local.

### Chat (de 011)

- `lib/chat-store.ts` é a camada otimista: cada envio gera um `clientMessageId`, a mensagem aparece na hora com `status: "sending"` e é trocada pela confirmada do servidor (ou marcada `failed`). O `clientMessageId` torna o envio idempotente na API.
- Tempo real por `chat.subscribe` (event iterator do oRPC, SSE por baixo), com reconexão automática e espera exponencial de 1 s até 15 s. Os eventos (`message.created`, `message.delivered`, `message.opened`, `conversation.updated`) atualizam o snapshot do store.
- A conversa de um anúncio é obtida ou criada por `chat.ensureConversationForAd`, de forma idempotente.
- **Briefing do anúncio para o chat por store em memória (D-05).** O briefing montado no simulador do anúncio chega ao chat por um store em memória (`lib/encounter-brief.ts`: `requestBriefHandoff`, `getBriefHandoff`, `clearBriefHandoff`), não por parâmetro na URL. O motivo é o `TabsKeepAlive` (`components/layout/tabs-keep-alive.tsx`): a aba do chat continua montada quando a pessoa sai dela, e uma tela já viva não roda efeito de montagem nem relê a query string, então um parâmetro novo na URL passaria despercebido. O store notifica a tela montada.

### Avaliações (de 012)

- Só a profissional convida, e só depois de uma conversa de mão dupla (as duas partes mandaram mensagem; `hasTwoWayConversation` e `canInviteToReview` em `packages/domain/src/review-gate.ts`). O convite vale 14 dias (`REVIEW_INVITE_TTL_DAYS`) e permite uma única avaliação por conversa; convite usado não pode ser retirado. A API aplica as mesmas funções do domain.

### Notificações (de 013)

- `lib/notifications.ts` marca como lida e marca todas como lidas de forma otimista: a tela muda na hora e a chamada à API vai em seguida. Se a API recusar, o erro é registrado e a lista volta a bater com o servidor na próxima leitura; não há desfazer imediato. Preferências só visuais por papel (banner fechado, notificações já vistas no sino, animação do sino pausada) ficam no `localStorage` do navegador, não na API.

### Premium no web (de 014)

- O servidor é a fonte de verdade do plano e dos limites: `premium.getState` (`lib/premium-state.ts`, `usePremiumState`) e `premium.plans` (`lib/premium-catalog.ts`, `usePremiumPlanOptions`). Sem sessão de profissional, ou com erro de rede antes de qualquer resposta, o web assume o plano e os limites padrão; um erro depois de já ter carregado mantém o último estado recebido do servidor.
- O gating de recursos premium no web (galeria, visualização única, apelido no chat) lê esses limites; a API repete a checagem em cada procedimento.
- Preços e opções de plano (`PREMIUM_PLAN_OPTIONS`) vivem no `packages/domain` e não mudam sem pedido do Daniel (D-02). A forma de lançamento gratuito está no ADR-018.

## Consequências

- `grep -r "mock-data\|isApiDataSource" apps/web` não retorna nada; qualquer dado do web passa pelo contrato.
- Uma mudança de contrato quebra o `tsc` do web e da API ao mesmo tempo.
- A E2E precisa da API, do Postgres e do MinIO no ar (o `webServer` do `playwright.config.ts` sobe a API e o web).
- `RATE_LIMIT_ENABLED` é configurável para a E2E rodar em paralelo sem 429 falso.
