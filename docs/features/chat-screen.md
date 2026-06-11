# Feature Contract — chat-screen

> Status: **concluída** · Última atualização: 2026-06-09

---

## Resumo
Chat interno da plataforma. Permite que clientes e profissionais troquem mensagens sem sair do ambiente monitorado. O frontend está pronto para integração com backend — a camada de serviço usa mock, mas os contratos REST estão documentados.

---

## Rota
- **Grupo**: `(private)` — requer autenticação
- **URL**: `/chat`
- **Arquivo de rota**: `app/(private)/chat/page.tsx`

---

## Arquivos da feature

| Arquivo | Status |
|---|---|
| `app/(private)/chat/page.tsx` | ✅ criado |
| `components/screens/chat-screen.tsx` | ✅ criado |
| `lib/chat-service.ts` | ✅ criado |
| `lib/types.ts` | ✅ atualizado |
| `lib/mock-data.ts` | ✅ atualizado |

---

## Tipos relevantes (`lib/types.ts`)

```typescript
Conversation {
  id, participantId, contactName, contactStatus,
  lastMessage, lastMessageAt, unread,
  currentUserAlias?, isBlocked?, deletedFromInboxAt?
}

Message {
  id, conversationId, senderId, senderRole, senderDisplayName,
  from, content?, messageType, status, media?, sentAt,
  deliveredAt?, editedAt?, deletedAt?
}

MessageStatus = "sending" | "sent" | "delivered" | "failed"
MessageType = "text" | "media"
```

---

## Contrato de serviço (`lib/chat-service.ts`)

| Função | Endpoint real (futuro) |
|---|---|
| `getChatSnapshot()` | `GET /api/chat/snapshot` |
| `sendTextMessage(...)` | `POST /api/chat/conversations/:id/messages` |
| `sendViewOnceMediaMessage(...)` | `POST /api/chat/conversations/:id/messages/media` |
| `setConversationBlocked(...)` | `PATCH /api/chat/conversations/:id/block` |
| `deleteConversationFromInbox(...)` | `DELETE /api/chat/conversations/:id/inbox` |
| `reportConversation(...)` | `POST /api/chat/conversations/:id/report` |
| `updateParticipantAlias(...)` | `PATCH /api/chat/conversations/:id/alias` |

---

## Estados de UI implementados

- ✅ Loading (skeleton de conversas)
- ✅ Erro ao carregar (com retry)
- ✅ Sem conversas (empty state)
- ✅ Conversa vazia (sem mensagens)
- ✅ Enviando (status otimista)
- ✅ Falhou (com indicador visual)
- ✅ Bloqueado (banner + input desativado)

---

## Regras de autenticação
- Visitante não autenticado → tela de bloqueio com links para login/cadastro
- Usuário autenticado → acesso completo ao chat

---

## Perguntas em aberto (para o backend)
Ver `docs/open-questions.md`:
- Mecanismo de autenticação real
- WebSocket vs SSE vs polling
- Storage de mídia view-once
