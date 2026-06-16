# Chat — Validação & Contratos de Backend

## ✅ Status Geral

O chat está **100% funcional no modo mock** e **estruturado para integração com o backend**.  
TypeScript compila sem erros. Todos os handlers estão conectados à camada de serviço.

---

## O que foi feito nessa validação

| Arquivo | Mudança |
|---|---|
| [chat-service.ts](file:///e:/-Progamacoes/projects/raparigator-front-nextjs/lib/chat-service.ts) | Reescrito com contratos de API documentados, feature flag `USE_MOCK`, e funções novas (`setConversationBlocked`, `deleteConversationFromInbox`, `reportConversation`, `updateParticipantAlias`) |
| [chat-screen.tsx](file:///e:/-Progamacoes/projects/raparigator-front-nextjs/components/screens/chat-screen.tsx) | Handlers de block, delete, report e alias agora chamam o service real (otimistas no front) |
| [.env.local.example](file:///e:/-Progamacoes/projects/raparigator-front-nextjs/.env.local.example) | Criado com documentação das variáveis de ambiente esperadas |

---

## Contratos de API

### `GET /api/chat/snapshot`
Carrega o estado inicial do chat (conversas + mensagens).

```ts
// Response
{
  conversations: Conversation[],
  messages: Message[]
}
```

### `POST /api/chat/conversations/:id/messages`
Envia mensagem de texto.

```ts
// Body
{ content: string, messageType: "text", senderDisplayName: string }
// Response: Message (com id real do servidor)
```

### `POST /api/chat/conversations/:id/messages/media`
Envia mídia temporária (view once).

```ts
// Body: multipart/form-data
// file, messageType: "media", senderDisplayName, isViewOnce: "true"
// Response: Message
```

### `PATCH /api/chat/conversations/:id/block`
Bloqueia ou desbloqueia um participante.

```ts
// Body: { isBlocked: boolean }
// Response: { conversationId: string, isBlocked: boolean }
```

### `DELETE /api/chat/conversations/:id/inbox`
Remove conversa da caixa de entrada (soft delete).

```
// Response: 204 No Content
```

### `POST /api/chat/conversations/:id/report`
Registra uma denúncia.

```ts
// Body: { reason: string }
// Response: { reportId: string }
```

### `PATCH /api/chat/conversations/:id/alias`
Salva apelido do usuário para uma conversa específica.

```ts
// Body: { alias: string | null }
// Response: { conversationId: string, alias: string | null }
```

---

## Como fazer a migração para o backend real

1. Defina a URL no ambiente:
   ```
   # .env.local
   NEXT_PUBLIC_API_URL=https://api.sigillus.com
   ```

2. No [chat-service.ts](file:///e:/-Progamacoes/projects/raparigator-front-nextjs/lib/chat-service.ts), troque a flag:
   ```ts
   const USE_MOCK = false; // linha 27
   ```

3. Descomente os blocos `fetch` em cada função e implemente `getAuthToken()` (retornando o token da sessão).

4. Para **tempo real** (WebSocket / SSE), adicione um hook `useChatSocket` separado que faz subscribe após o snapshot inicial e atualiza `localConversations` e `localMessages` via `setLocalConversations` / `setLocalMessages`.

---

## Tipos TypeScript validados

Os tipos em [types.ts](file:///e:/-Progamacoes/projects/raparigator-front-nextjs/lib/types.ts) estão prontos para o backend:

| Tipo | Campo | Notas |
|---|---|---|
| `Conversation` | `id`, `participantId`, `contactName`, `contactStatus`, `lastMessage`, `lastMessageAt`, `unread`, `currentUserAlias?`, `isBlocked?`, `deletedFromInboxAt?` | Compatível com REST |
| `Message` | `id`, `conversationId`, `senderId`, `senderRole`, `senderDisplayName`, `from`, `content?`, `messageType`, `status`, `media?`, `sentAt`, `deliveredAt?`, `editedAt?`, `deletedAt?` | Compatível com REST |
| `MessageStatus` | `"sending" \| "sent" \| "delivered" \| "failed"` | `"sending"` é apenas local, nunca vem do backend |

> [!NOTE]
> O campo `from: "me" | "other"` é derivado no frontend (comparando `senderId` com o `currentUser.id`). O backend pode retornar apenas `senderId` e o cliente resolve.

---

## Funcionalidades do chat validadas

- [x] Carregamento inicial com loading skeleton e retry em erro de rede
- [x] Lista de conversas com avatar, status online/offline, badge de não lidos
- [x] Abertura de conversa com histórico de mensagens
- [x] Envio de texto com UI otimista (sending → sent / failed)
- [x] Envio de mídia temporária (view once) com UI otimista
- [x] Apelido por conversa e apelido global
- [x] Toggle de presença online/offline
- [x] Bloquear / desbloquear usuário (otimista + service)
- [x] Excluir conversa da caixa (otimista + service)
- [x] Denunciar conversa (otimista + service)
- [x] Link para anúncio público do contato
- [x] Link para WhatsApp
- [x] Responsividade mobile (painel lateral escondido, conversa fullscreen)
- [x] Guard de autenticação (redireciona para login se não autenticado)
- [x] Toast de feedback para todas as ações

> [!TIP]
> Para o **tempo real**, o próximo passo recomendado é criar um `useChatRealtime` hook que recebe as atualizações via WebSocket e chama `setLocalMessages` / `setLocalConversations` para manter o estado sincronizado.
