/**
 * chat-service.ts
 *
 * Camada de serviço do chat. Atualmente usa dados mock para desenvolvimento.
 *
 * ──────────────────────────────────────────────────────────────────────────
 *  INTEGRAÇÃO COM BACKEND
 * ──────────────────────────────────────────────────────────────────────────
 *  Quando o backend estiver pronto, basta:
 *  1. Definir NEXT_PUBLIC_API_URL no .env.local
 *  2. Trocar USE_MOCK para false (ou remover a flag e usar apenas a API real)
 *  3. Cada função já tem o contrato REST / WebSocket documentado abaixo.
 *
 *  Autenticação esperada: Bearer token via header Authorization.
 *  O token deve ser obtido no login e salvo no AuthSession do cliente.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { conversations, messages } from "@/lib/mock-data";
import type { Conversation, Message } from "@/lib/types";

// ---------------------------------------------------------------------------
// Feature flag — troque para false quando a API real estiver disponível
// ---------------------------------------------------------------------------
const USE_MOCK = true;

// ---------------------------------------------------------------------------
// Base URL da API — definida via variável de ambiente
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Simula latência de rede no modo mock. */
const delay = (ms = 260) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const cloneConversation = (c: Conversation): Conversation => ({ ...c });
const cloneMessage = (m: Message): Message => ({ ...m, media: m.media ? { ...m.media } : undefined });

// ---------------------------------------------------------------------------
// Tipos públicos
// ---------------------------------------------------------------------------

export interface ChatSnapshot {
  conversations: Conversation[];
  messages: Message[];
}

let cachedSnapshot: ChatSnapshot | null = null;
const unreadListeners = new Set<() => void>();

function cloneSnapshot(snapshot: ChatSnapshot): ChatSnapshot {
  return {
    conversations: snapshot.conversations.map(cloneConversation),
    messages: snapshot.messages.map(cloneMessage),
  };
}

function buildMockSnapshot(): ChatSnapshot {
  return {
    conversations: conversations.map(cloneConversation).filter((conversation) => !conversation.deletedFromInboxAt),
    messages: messages.map(cloneMessage).filter((message) => !message.deletedAt),
  };
}

function setCachedSnapshot(snapshot: ChatSnapshot, notify = true) {
  cachedSnapshot = snapshot;
  if (!notify) {
    return;
  }

  queueMicrotask(() => {
    unreadListeners.forEach((listener) => listener());
  });
}

function ensureMockSnapshotCached() {
  if (USE_MOCK && !cachedSnapshot) {
    setCachedSnapshot(buildMockSnapshot(), false);
  }
}

if (typeof window !== "undefined") {
  ensureMockSnapshotCached();
}

export function getChatUnreadCount(): number {
  ensureMockSnapshotCached();
  const snapshot = cachedSnapshot ?? buildMockSnapshot();
  return snapshot.conversations.reduce((total, conversation) => total + (conversation.unread || 0), 0);
}

export function subscribeChatUnread(listener: () => void) {
  unreadListeners.add(listener);
  return () => unreadListeners.delete(listener);
}

export function getCachedChatSnapshot(): ChatSnapshot | null {
  if (!cachedSnapshot) {
    return null;
  }

  return cloneSnapshot(cachedSnapshot);
}

export function publishChatSnapshot(nextConversations: Conversation[], nextMessages: Message[]) {
  setCachedSnapshot({
    conversations: nextConversations.map(cloneConversation),
    messages: nextMessages.map(cloneMessage),
  });
}

// ---------------------------------------------------------------------------
// getChatSnapshot
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    GET /api/chat/snapshot
//    Headers: Authorization: Bearer <token>
//    Response: {
//      conversations: Conversation[],
//      messages:      Message[]       // apenas últimas mensagens visíveis
//    }
//    HTTP 200 → snapshot ok
//    HTTP 401 → token inválido / expirado → redirecionar para login
//    HTTP 403 → sem permissão
//
//  NOTAS:
//    - O backend deve retornar apenas conversas e mensagens do usuário autenticado.
//    - Conversas com deletedFromInboxAt preenchido não devem vir na resposta,
//      ou o filtro pode ser feito aqui no cliente (já está sendo feito).
//    - Para realtime (WebSocket / SSE) o snapshot é o estado inicial; as
//      atualizações seguintes chegam por push. Adicionar lógica de subscribe
//      nessa função ou num hook separado.
// ---------------------------------------------------------------------------

export async function getChatSnapshot(): Promise<ChatSnapshot> {
  if (USE_MOCK) {
    ensureMockSnapshotCached();
    return cloneSnapshot(cachedSnapshot!);
  }

  // TODO: remover bloco mock acima e descomentar abaixo quando a API estiver pronta
  // const res = await fetch(`${API_BASE}/api/chat/snapshot`, {
  //   headers: { Authorization: `Bearer ${getAuthToken()}` },
  // });
  // if (!res.ok) throw new Error(`getChatSnapshot: HTTP ${res.status}`);
  // return res.json() as Promise<ChatSnapshot>;
  throw new Error("API real não configurada. Defina NEXT_PUBLIC_API_URL e troque USE_MOCK para false.");
}

// ---------------------------------------------------------------------------
// sendTextMessage
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    POST /api/chat/conversations/:conversationId/messages
//    Headers: Authorization: Bearer <token>
//    Body (JSON): {
//      content:           string,   // texto da mensagem
//      messageType:       "text",
//      senderDisplayName: string    // apelido que o cliente quer exibir
//    }
//    Response: Message   (objeto completo criado pelo servidor, com id real)
//    HTTP 201 → mensagem criada
//    HTTP 400 → payload inválido (content vazio, etc.)
//    HTTP 403 → conversa bloqueada pelo servidor ou usuário sem acesso
//    HTTP 404 → conversationId não encontrado
//
//  FLUXO OTIMISTA (já implementado no ChatScreen):
//    1. Mensagem local com status "sending" é exibida imediatamente.
//    2. Ao resolver, o id local é substituído pelo id real do servidor.
//    3. Ao falhar, status passa para "failed" e o usuário pode reenviar.
// ---------------------------------------------------------------------------

export async function sendTextMessage(
  conversationId: string,
  content: string,
  senderDisplayName: string,
): Promise<Message> {
  if (USE_MOCK) {
    await delay(420);
    return {
      id: `srv-${Date.now()}`,
      conversationId,
      senderId: "current-user",
      senderRole: "cliente",
      senderDisplayName,
      from: "me",
      content,
      messageType: "text",
      status: "sent",
      sentAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      deliveredAt: null,
      editedAt: null,
      deletedAt: null,
    };
  }

  // TODO: descomentar quando a API estiver pronta
  // const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/messages`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${getAuthToken()}`,
  //   },
  //   body: JSON.stringify({ content, messageType: "text", senderDisplayName }),
  // });
  // if (!res.ok) throw new Error(`sendTextMessage: HTTP ${res.status}`);
  // return res.json() as Promise<Message>;
  throw new Error("API real não configurada.");
}

// ---------------------------------------------------------------------------
// sendViewOnceMediaMessage
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    POST /api/chat/conversations/:conversationId/messages/media
//    Headers:
//      Authorization: Bearer <token>
//      Content-Type: multipart/form-data
//    Body (FormData):
//      file:              File      // arquivo de imagem/vídeo
//      messageType:       "media"
//      senderDisplayName: string
//      isViewOnce:        "true"
//    Response: Message   (com media.id apontando para storage privado)
//    HTTP 201 → ok
//    HTTP 400 → arquivo inválido ou faltando
//    HTTP 413 → arquivo muito grande (definir limite no backend, ex: 25MB)
//
//  NOTAS:
//    - O backend deve salvar o arquivo em storage privado (S3, R2, etc.)
//      e gerar uma URL pré-assinada com expiração curta para exibição.
//    - Após a primeira abertura, o backend deve marcar openedAt e a URL
//      não deve mais ser acessível (ou retornar conteúdo alternativo).
//    - No frontend a simulação não faz upload real; ao integrar, o input
//      <file> precisa ser adicionado ao modal de mídia temporária.
// ---------------------------------------------------------------------------

export async function sendViewOnceMediaMessage(
  conversationId: string,
  senderDisplayName: string,
): Promise<Message> {
  if (USE_MOCK) {
    await delay(520);
    return {
      id: `media-${Date.now()}`,
      conversationId,
      senderId: "current-user",
      senderRole: "cliente",
      senderDisplayName,
      from: "me",
      messageType: "media",
      status: "sent",
      media: {
        id: `asset-${Date.now()}`,
        kind: "image",
        name: "Mídia temporária",
        isViewOnce: true,
        openedAt: null,
      },
      sentAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      deliveredAt: null,
      editedAt: null,
      deletedAt: null,
    };
  }

  // TODO: descomentar e adaptar quando o backend estiver pronto
  // const formData = new FormData();
  // formData.append("file", file);  // <-- adicionar parâmetro `file: File` à função
  // formData.append("messageType", "media");
  // formData.append("senderDisplayName", senderDisplayName);
  // formData.append("isViewOnce", "true");
  // const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/messages/media`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${getAuthToken()}` },
  //   body: formData,
  // });
  // if (!res.ok) throw new Error(`sendViewOnceMediaMessage: HTTP ${res.status}`);
  // return res.json() as Promise<Message>;
  throw new Error("API real não configurada.");
}

// ---------------------------------------------------------------------------
// blockConversation / unblockConversation
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    PATCH /api/chat/conversations/:conversationId/block
//    Body: { isBlocked: boolean }
//    Headers: Authorization: Bearer <token>
//    Response: { conversationId: string, isBlocked: boolean }
//    HTTP 200 → ok
//
//  NOTAS:
//    - O bloqueio no frontend é otimista (estado local imediato).
//    - No backend, o bloqueio deve impedir que novas mensagens sejam aceitas
//      de ambos os lados (ou apenas do bloqueado, dependendo da regra de negócio).
// ---------------------------------------------------------------------------

export async function setConversationBlocked(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isBlocked: boolean,
): Promise<void> {
  if (USE_MOCK) {
    await delay(200);
    return;
  }

  // TODO: descomentar quando a API estiver pronta
  // const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/block`, {
  //   method: "PATCH",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${getAuthToken()}`,
  //   },
  //   body: JSON.stringify({ isBlocked }),
  // });
  // if (!res.ok) throw new Error(`setConversationBlocked: HTTP ${res.status}`);
  throw new Error("API real não configurada.");
}

// ---------------------------------------------------------------------------
// deleteConversationFromInbox
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    DELETE /api/chat/conversations/:conversationId/inbox
//    Headers: Authorization: Bearer <token>
//    Response: 204 No Content
//
//  NOTAS:
//    - Soft delete: o backend registra deletedFromInboxAt no registro do
//      participante, sem apagar mensagens (para fins de auditoria).
//    - O frontend já filtra conversas com deletedFromInboxAt preenchido.
// ---------------------------------------------------------------------------

export async function deleteConversationFromInbox(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationId: string,
): Promise<void> {
  if (USE_MOCK) {
    await delay(200);
    return;
  }

  // TODO: descomentar quando a API estiver pronta
  // const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/inbox`, {
  //   method: "DELETE",
  //   headers: { Authorization: `Bearer ${getAuthToken()}` },
  // });
  // if (!res.ok) throw new Error(`deleteConversationFromInbox: HTTP ${res.status}`);
  throw new Error("API real não configurada.");
}

// ---------------------------------------------------------------------------
// reportConversation
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    POST /api/chat/conversations/:conversationId/report
//    Headers: Authorization: Bearer <token>
//    Body: { reason: string }
//    Response: { reportId: string }
//    HTTP 201 → denúncia registrada
//
//  NOTAS:
//    - O backend deve armazenar a denúncia e notificar moderadores.
//    - Deve ser idempotente: um usuário não deve conseguir denunciar a mesma
//      conversa mais de uma vez em curto período de tempo.
// ---------------------------------------------------------------------------

export async function reportConversation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reason: string,
): Promise<void> {
  if (USE_MOCK) {
    await delay(300);
    return;
  }

  // TODO: descomentar quando a API estiver pronta
  // const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/report`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${getAuthToken()}`,
  //   },
  //   body: JSON.stringify({ reason }),
  // });
  // if (!res.ok) throw new Error(`reportConversation: HTTP ${res.status}`);
  throw new Error("API real não configurada.");
}

// ---------------------------------------------------------------------------
// updateParticipantAlias
// ---------------------------------------------------------------------------
//
//  BACKEND CONTRACT:
//    PATCH /api/chat/conversations/:conversationId/alias
//    Headers: Authorization: Bearer <token>
//    Body: { alias: string | null }   // null remove o apelido específico
//    Response: { conversationId: string, alias: string | null }
//    HTTP 200 → ok
//
//  NOTAS:
//    - Alias é por conversa e por usuário (não é global e não é visível
//      para o outro participante).
//    - O apelido geral (globalAlias) fica no perfil do usuário:
//      PATCH /api/users/me  { alias: string }
// ---------------------------------------------------------------------------

export async function updateParticipantAlias(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  conversationId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  alias: string | null,
): Promise<void> {
  if (USE_MOCK) {
    await delay(200);
    return;
  }

  // TODO: descomentar quando a API estiver pronta
  // const res = await fetch(`${API_BASE}/api/chat/conversations/${conversationId}/alias`, {
  //   method: "PATCH",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${getAuthToken()}`,
  //   },
  //   body: JSON.stringify({ alias }),
  // });
  // if (!res.ok) throw new Error(`updateParticipantAlias: HTTP ${res.status}`);
  throw new Error("API real não configurada.");
}
