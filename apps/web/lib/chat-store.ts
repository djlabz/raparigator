import {
  fetchBriefMessage,
  fetchConversations,
  fetchDeleteConversationFromInbox,
  fetchEnsureConversationForAd,
  fetchMarkConversationRead,
  fetchMessages,
  fetchReportConversation,
  fetchSetConversationBlocked,
  fetchTextMessage,
  fetchUpdateParticipantAlias,
  fetchViewOnceMediaMessage,
} from "@/lib/chat-service";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import { ads, conversations as mockConversations, messages as mockMessages } from "@/lib/mock-data";
import type {
  ChatEvent,
  ChatMutationResult,
  ChatSendResult,
  ChatSnapshot,
} from "@/lib/chat-store-types";
import type { Conversation, EncounterBrief, Message } from "@/lib/types";

const EMPTY_SNAPSHOT: ChatSnapshot = { conversations: [], messages: [] };

let snapshot: ChatSnapshot = EMPTY_SNAPSHOT;
let seeded = false;
let apiInitialized = false;
const listeners = new Set<() => void>();

let sseController: AbortController | null = null;
let sseActive = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

function cloneConversation(conversation: Conversation): Conversation {
  return { ...conversation };
}

function cloneMessage(message: Message): Message {
  return {
    ...message,
    media: message.media ? { ...message.media } : undefined,
    brief: message.brief ? { ...message.brief, extras: [...message.brief.extras] } : undefined,
  };
}

function buildSeedSnapshot(): ChatSnapshot {
  return {
    conversations: mockConversations
      .map(cloneConversation)
      .filter((conversation) => !conversation.deletedFromInboxAt),
    messages: mockMessages.map(cloneMessage).filter((message) => !message.deletedAt),
  };
}

function emit() {
  queueMicrotask(() => {
    listeners.forEach((listener) => listener());
  });
}

function replaceSnapshot(next: ChatSnapshot) {
  snapshot = next;
  emit();
}

export function getServerChatStoreSnapshot(): ChatSnapshot {
  return EMPTY_SNAPSHOT;
}

export function getChatStoreSnapshot(): ChatSnapshot {
  ensureChatStore();
  return snapshot;
}

async function refreshConversations(): Promise<void> {
  if (!isApiDataSource() || typeof window === "undefined") {
    return;
  }
  try {
    const remoteConversations = await fetchConversations();
    const current = snapshot;
    replaceSnapshot({
      ...current,
      conversations: remoteConversations.filter((c) => !c.deletedFromInboxAt),
    });
  } catch {
    return;
  }
}

export async function loadConversationMessages(conversationId: string): Promise<void> {
  if (!isApiDataSource() || typeof window === "undefined" || !conversationId) {
    return;
  }
  try {
    const { items } = await fetchMessages(conversationId, { limit: 50 });
    const current = snapshot;
    const pendingOptimistic = current.messages.filter(
      (m) => m.conversationId === conversationId && m.status === "sending",
    );
    const otherMessages = current.messages.filter((m) => m.conversationId !== conversationId);
    const map = new Map<string, Message>();
    for (const item of items) {
      map.set(item.id, item);
    }
    for (const opt of pendingOptimistic) {
      if (!map.has(opt.id)) {
        map.set(opt.id, opt);
      }
    }
    replaceSnapshot({
      ...current,
      messages: [...otherMessages, ...Array.from(map.values())],
    });
  } catch {
    return;
  }
}

function handleChatEvent(event: ChatEvent) {
  if (event.type === "message.created") {
    void refreshConversations();
    void loadConversationMessages(event.conversationId);
  } else if (event.type === "message.delivered") {
    const current = snapshot;
    replaceSnapshot({
      ...current,
      messages: current.messages.map((m) =>
        m.id === event.messageId
          ? { ...m, status: "delivered", deliveredAt: event.deliveredAt }
          : m,
      ),
    });
  } else if (event.type === "message.opened") {
    const current = snapshot;
    replaceSnapshot({
      ...current,
      messages: current.messages.map((m) =>
        m.id === event.messageId && m.media
          ? { ...m, media: { ...m.media, openedAt: event.openedAt } }
          : m,
      ),
    });
  } else if (event.type === "conversation.updated") {
    void refreshConversations();
  }
}

export function startChatEventStream() {
  if (typeof window === "undefined" || !isApiDataSource() || sseActive) {
    return;
  }
  sseActive = true;
  sseController = new AbortController();
  const signal = sseController.signal;

  (async () => {
    try {
      const stream = await getApiClient().chat.subscribe({}, { signal });
      reconnectAttempts = 0;
      for await (const event of stream) {
        if (signal.aborted) break;
        handleChatEvent(event);
      }
    } catch {
      return;
    } finally {
      sseActive = false;
      if (!signal.aborted) {
        const backoffMs = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
        reconnectAttempts += 1;
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(startChatEventStream, backoffMs);
      }
    }
  })();
}

export function stopChatEventStream() {
  if (sseController) {
    sseController.abort();
    sseController = null;
  }
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  sseActive = false;
  reconnectAttempts = 0;
}

export function ensureChatStore(): ChatSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }
  if (!isApiDataSource()) {
    if (!seeded) {
      seeded = true;
      snapshot = buildSeedSnapshot();
    }
    return snapshot;
  }

  if (!apiInitialized) {
    apiInitialized = true;
    void refreshConversations().then(() => {
      const current = snapshot;
      if (current.conversations.length > 0) {
        void loadConversationMessages(current.conversations[0].id);
      }
    });
    startChatEventStream();
  }
  return snapshot;
}

export function reseedChatStore(): ChatSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_SNAPSHOT;
  }
  if (!isApiDataSource()) {
    seeded = true;
    replaceSnapshot(buildSeedSnapshot());
    return snapshot;
  }
  void refreshConversations();
  return snapshot;
}

export function subscribeChatStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getChatUnreadCount(): number {
  const current = getChatStoreSnapshot();
  return current.conversations.reduce(
    (total, conversation) => total + (conversation.unread || 0),
    0,
  );
}

export function markConversationAsRead(conversationId: string) {
  const current = ensureChatStore();
  const target = current.conversations.find((conversation) => conversation.id === conversationId);
  if (!target || target.unread === 0) {
    return;
  }
  replaceSnapshot({
    ...current,
    conversations: current.conversations.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation,
    ),
  });
  if (isApiDataSource()) {
    void fetchMarkConversationRead(conversationId);
  }
}

function syncPreview(
  current: ChatSnapshot,
  conversationId: string,
  lastMessage: string,
): Conversation[] {
  return current.conversations.map((conversation) =>
    conversation.id === conversationId
      ? { ...conversation, lastMessage, lastMessageAt: "agora", unread: 0 }
      : conversation,
  );
}

export async function ensureConversationForAd(adSlug: string): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  const current = ensureChatStore();
  const existing = current.conversations.find((conversation) => conversation.adSlug === adSlug);
  if (existing) {
    return existing.id;
  }

  if (!isApiDataSource()) {
    const ad = ads.find((item) => item.slug === adSlug);
    if (!ad) {
      return null;
    }

    const conversation: Conversation = {
      id: `local-conv-${adSlug}`,
      participantId: ad.id,
      contactName: ad.artisticName,
      contactStatus: ad.status === "indisponivel" ? "offline" : "online",
      lastMessage: "Conversa iniciada pelo anúncio",
      lastMessageAt: "agora",
      unread: 0,
      adSlug,
    };

    replaceSnapshot({
      ...current,
      conversations: [conversation, ...current.conversations],
    });

    return conversation.id;
  }

  try {
    const conversationId = await fetchEnsureConversationForAd(adSlug);
    await refreshConversations();
    return conversationId;
  } catch {
    return null;
  }
}

export async function sendChatBrief(
  conversationId: string,
  brief: EncounterBrief,
  greeting: string,
  senderDisplayName: string,
): Promise<ChatSendResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }
  if (conversation.isBlocked) {
    return { ok: false, reason: "blocked" };
  }

  const clientMessageId = `cmsg_brief_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const optimisticId = clientMessageId;
  const optimisticMessage: Message = {
    id: optimisticId,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content: greeting,
    messageType: "brief",
    status: "sending",
    brief: { ...brief, extras: [...brief.extras] },
    sentAt: "agora",
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };

  replaceSnapshot({
    conversations: syncPreview(current, conversationId, `Interesse enviado · ${brief.duration}`),
    messages: [...current.messages, optimisticMessage],
  });

  try {
    const confirmed = await fetchBriefMessage(
      conversationId,
      brief,
      greeting,
      senderDisplayName,
      clientMessageId,
    );
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? confirmed : message,
      ),
    });
    return { ok: true, messageId: confirmed.id };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ),
    });
    return { ok: false, reason: "adapter_error", messageId: optimisticId };
  }
}

export async function sendChatText(
  conversationId: string,
  content: string,
  senderDisplayName: string,
): Promise<ChatSendResult> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }
  if (conversation.isBlocked) {
    return { ok: false, reason: "blocked" };
  }

  const clientMessageId = `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const optimisticId = clientMessageId;
  const optimisticMessage: Message = {
    id: optimisticId,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content: trimmed,
    messageType: "text",
    status: "sending",
    sentAt: "agora",
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };

  replaceSnapshot({
    conversations: syncPreview(current, conversationId, trimmed),
    messages: [...current.messages, optimisticMessage],
  });

  try {
    const confirmed = await fetchTextMessage(
      conversationId,
      trimmed,
      senderDisplayName,
      clientMessageId,
    );
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? confirmed : message,
      ),
    });
    return { ok: true, messageId: confirmed.id };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ),
    });
    return { ok: false, reason: "adapter_error", messageId: optimisticId };
  }
}

export async function sendChatViewOnceMedia(
  conversationId: string,
  senderDisplayName: string,
  assetId?: string,
): Promise<ChatSendResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }
  if (conversation.isBlocked) {
    return { ok: false, reason: "blocked" };
  }

  const clientMessageId = `cmsg_media_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const optimisticId = clientMessageId;
  const optimisticMessage: Message = {
    id: optimisticId,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    messageType: "media",
    status: "sending",
    media: {
      id: assetId ?? `local-asset-${Date.now()}`,
      kind: "image",
      name: "Mídia temporária",
      isViewOnce: true,
      openedAt: null,
    },
    sentAt: "agora",
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };

  replaceSnapshot({
    conversations: syncPreview(current, conversationId, "Mídia temporária"),
    messages: [...current.messages, optimisticMessage],
  });

  try {
    const confirmed = await fetchViewOnceMediaMessage(
      conversationId,
      senderDisplayName,
      assetId,
      clientMessageId,
    );
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? confirmed : message,
      ),
    });
    return { ok: true, messageId: confirmed.id };
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      messages: latest.messages.map((message) =>
        message.id === optimisticId ? { ...message, status: "failed" } : message,
      ),
    });
    return { ok: false, reason: "adapter_error", messageId: optimisticId };
  }
}

export async function setChatConversationBlocked(
  conversationId: string,
  isBlocked: boolean,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }

  const previousBlocked = Boolean(conversation.isBlocked);
  replaceSnapshot({
    ...current,
    conversations: current.conversations.map((item) =>
      item.id === conversationId ? { ...item, isBlocked } : item,
    ),
  });

  try {
    const result = await fetchSetConversationBlocked(conversationId, isBlocked);
    if (!result.ok) {
      throw new Error("failed");
    }
    return result;
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      conversations: latest.conversations.map((item) =>
        item.id === conversationId ? { ...item, isBlocked: previousBlocked } : item,
      ),
    });
    return { ok: false, reason: "adapter_error" };
  }
}

export async function deleteChatConversationFromInbox(
  conversationId: string,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }

  replaceSnapshot({
    ...current,
    conversations: current.conversations.filter((item) => item.id !== conversationId),
  });

  try {
    const result = await fetchDeleteConversationFromInbox(conversationId);
    if (!result.ok) {
      throw new Error("failed");
    }
    return result;
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      conversations: latest.conversations.some((c) => c.id === conversationId)
        ? latest.conversations
        : [...latest.conversations, conversation],
    });
    return { ok: false, reason: "adapter_error" };
  }
}

export async function reportChatConversation(
  conversationId: string,
  reason: string,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  if (!current.conversations.some((item) => item.id === conversationId)) {
    return { ok: false, reason: "not_found" };
  }

  try {
    return await fetchReportConversation(conversationId, reason);
  } catch {
    return { ok: false, reason: "adapter_error" };
  }
}

export async function updateChatParticipantAlias(
  conversationId: string,
  alias: string | null,
): Promise<ChatMutationResult> {
  const current = ensureChatStore();
  const conversation = current.conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    return { ok: false, reason: "not_found" };
  }

  const previousAlias = conversation.currentUserAlias;
  const nextAlias = alias && alias.trim() ? alias.trim() : undefined;

  replaceSnapshot({
    ...current,
    conversations: current.conversations.map((item) =>
      item.id === conversationId ? { ...item, currentUserAlias: nextAlias } : item,
    ),
  });

  try {
    const result = await fetchUpdateParticipantAlias(conversationId, nextAlias ?? null);
    if (!result.ok) {
      throw new Error("failed");
    }
    return result;
  } catch {
    const latest = ensureChatStore();
    replaceSnapshot({
      ...latest,
      conversations: latest.conversations.map((item) =>
        item.id === conversationId ? { ...item, currentUserAlias: previousAlias } : item,
      ),
    });
    return { ok: false, reason: "adapter_error" };
  }
}
