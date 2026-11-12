# ADR-011 — Migração de Chat, Camada Otimista e Streaming em Tempo Real

- Status: aceito (2026-10-09)

## Contexto

A plataforma Sigillus possui um chat privado de ponta a ponta entre clientes e acompanhantes para troca de mensagens de texto, briefings de interesse gerados a partir do simulador do anúncio e fotos temporárias de visualização única (view-once).

Antes desta task (T-14), o chat no web em `apps/web` funcionava exclusivamente com dados locais do `apps/web/lib/mock-data.ts`, simulação de delay assíncrono em `apps/web/lib/chat-service.ts` e store em memória/estado em `apps/web/lib/chat-store.ts`. O vínculo entre conversa e anúncio dependia de função síncrona `getConversationAd` em `apps/web/lib/conversation-ad.ts`.

Na API, o módulo `chat` (`apps/api/src/modules/chat/`) já implementa todos os procedimentos contratuais:

- `chat.listConversations`: lista as conversas do usuário autenticado (com contagem de não-lidas, status online e prévias).
- `chat.listMessages`: lista mensagens paginadas por cursor para a conversa especificada.
- `chat.ensureConversationForAd`: obtém ou cria a conversa idempotente vinculada ao anúncio profissional para o cliente autenticado.
- `chat.sendText`: envia mensagem de texto com suporte a deduplicação por `clientMessageId`.
- `chat.sendBrief`: envia card de simulação de encontro com saudação inicial e `clientMessageId`.
- `chat.sendMedia`: envia mídia vinculada a asset pronto, com checagem de regras de visualização única e plano premium.
- `chat.openViewOnce`: consome a visualização única de uma mensagem de mídia.
- `chat.markRead`: marca as mensagens da conversa como lidas e zera o contador.
- `chat.setBlocked`: bloqueia ou desbloqueia a conversa para o usuário.
- `chat.deleteFromInbox`: remove a conversa da caixa de entrada do usuário.
- `chat.report`: registra denúncia contra uma conversa.
- `chat.updateAlias`: define apelido personalizado para a conversa (cliente livre, profissional restrito por plano).
- `chat.subscribe`: streaming SSE via event iterator do oRPC com emissão de eventos em tempo real (`message.created`, `message.delivered`, `message.opened`, `conversation.updated`, `heartbeat`).

## Decisão

**Migrar o módulo de chat no web para dual-mode (`NEXT_PUBLIC_DATA_SOURCE=mock|api`), conectando o store otimista aos procedimentos do oRPC e integrando o streaming de eventos SSE em tempo real.**

1. **Camada de Serviço (`apps/web/lib/chat-service.ts`)**:
   - Conectar diretamente a `getApiClient().chat.*` quando `isApiDataSource()` estiver ativo.
   - Preservar respostas mock simuladas com delay quando em modo `mock`.
   - Adicionar suporte a `clientMessageId` nos métodos de envio de mensagens para garantir idempotência.

2. **Store Reativo e Camada Otimista (`apps/web/lib/chat-store.ts`)**:
   - Manter a store reativa baseada em `useSyncExternalStore` com snapshot `{ conversations, messages }`.
   - Gerar `clientMessageId` único em cada envio (`sendChatText`, `sendChatBrief`, `sendChatViewOnceMedia`) e renderizar a mensagem imediatamente na tela com `status: "sending"`.
   - Atualizar a mensagem otimista com os dados confirmados do servidor (`status: "sent"` ou `"delivered"`) após o retorno da API, ou marcar como `"failed"` em caso de erro na rede.
   - Implementar `startChatEventStream()` consumindo `getApiClient().chat.subscribe({})`, com reconexão automática e backoff exponencial (1s, 2s, 4s até 15s) em caso de queda de conexão.
   - Atualizar o snapshot em tempo real na chegada de eventos:
     - `message.created`: atualiza lista de conversas e carrega a nova mensagem da conversa.
     - `message.delivered`: atualiza status para `"delivered"` com `deliveredAt`.
     - `message.opened`: atualiza registro da mídia view-once com `openedAt`.
     - `conversation.updated`: atualiza lista de conversas.
   - Tornar `ensureConversationForAd(adSlug)` assíncrono para obter ou criar a conversa na API via `chat.ensureConversationForAd`, mantendo compatibilidade com mock.

3. **Vínculo com Anúncios (`apps/web/lib/ad-data.ts` e `apps/web/lib/conversation-ad.ts`)**:
   - Adicionar `fetchAdBySlug` e `getCachedAd` aproveitando o cache de anúncios em memória.
   - Implementar `fetchConversationAd` assíncrono e o hook reativo `useConversationAd` em `conversation-ad.ts`.
   - Atualizar `chat-screen.tsx`, `contacts-tab.tsx` e `review-cta.tsx` para suporte a `conversation.adSlug` e resolução reativa de anúncios.

4. **UI do Chat (`apps/web/components/screens/chat-screen.tsx` e `ad-details/use-contact-cta.ts`)**:
   - `useContactCta`: aguarda a resolução de `ensureConversationForAd(brief.adSlug)` antes de navegar para `/chat` com o briefing pendente.
   - `chat-screen.tsx`: integra `useConversationAd(activeConversation)`, dispara carregamento sob demanda de mensagens ao trocar a conversa ativa via `loadConversationMessages` e formata timestamps ISO de forma amigável (`formatChatTime`).

## Consequências

- Mensagens de texto e briefings de encontro trafegam diretamente pela API com resposta em tempo real via SSE.
- O remetente obtém feedback instantâneo de envio graças à camada otimista e deduplicação via `clientMessageId`.
- O destinatário recebe novas mensagens em outra aba/dispositivo em tempo real sem necessitar de recarregar a página ou de polling HTTP.
- O modo `mock` continua 100% suportado e todos os testes E2E Playwright (`chat.spec.ts`, `encounter-brief.spec.ts`) continuam verdes.
- A próxima task (T-15 — Avaliações e convites) poderá se apoiar na conversa de chat já estabelecida para liberar convites e submissão de reviews.
