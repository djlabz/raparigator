import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import type {
  ChatMutationResult,
  Conversation,
  EncounterBrief,
  Message,
} from "@sigillus/contracts";

export async function delay(ms = 260): Promise<void> {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function fetchConversations(): Promise<Conversation[]> {
  if (!isApiDataSource()) {
    return [];
  }
  return getApiClient().chat.listConversations();
}

export async function fetchMessages(
  conversationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<{ items: Message[]; hasMore: boolean }> {
  if (!isApiDataSource()) {
    return { items: [], hasMore: false };
  }
  return getApiClient().chat.listMessages({ conversationId, ...options });
}

export async function fetchEnsureConversationForAd(adSlug: string): Promise<string> {
  const result = await getApiClient().chat.ensureConversationForAd({ adSlug });
  return result.conversationId;
}

export async function fetchTextMessage(
  conversationId: string,
  content: string,
  senderDisplayName: string,
  clientMessageId?: string,
): Promise<Message> {
  if (isApiDataSource()) {
    const result = await getApiClient().chat.sendText({
      conversationId,
      content,
      clientMessageId,
    });
    return result.message;
  }

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

export async function fetchBriefMessage(
  conversationId: string,
  brief: EncounterBrief,
  greeting: string,
  senderDisplayName: string,
  clientMessageId?: string,
): Promise<Message> {
  if (isApiDataSource()) {
    const result = await getApiClient().chat.sendBrief({
      conversationId,
      brief,
      greeting,
      clientMessageId,
    });
    return result.message;
  }

  await delay(460);
  return {
    id: `brief-${Date.now()}`,
    conversationId,
    senderId: "current-user",
    senderRole: "cliente",
    senderDisplayName,
    from: "me",
    content: greeting,
    messageType: "brief",
    status: "sent",
    brief: { ...brief, extras: [...brief.extras] },
    sentAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    deliveredAt: null,
    editedAt: null,
    deletedAt: null,
  };
}

export async function fetchViewOnceMediaMessage(
  conversationId: string,
  senderDisplayName: string,
  assetId?: string,
  clientMessageId?: string,
): Promise<Message> {
  if (isApiDataSource()) {
    if (!assetId) {
      throw new Error("Mídia não informada");
    }
    const result = await getApiClient().chat.sendMedia({
      conversationId,
      assetId,
      isViewOnce: true,
      clientMessageId,
    });
    return result.message;
  }

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

export async function fetchSetConversationBlocked(
  conversationId: string,
  isBlocked: boolean,
): Promise<ChatMutationResult> {
  if (isApiDataSource()) {
    return getApiClient().chat.setBlocked({ conversationId, isBlocked });
  }
  await delay(200);
  return { ok: true };
}

export async function fetchDeleteConversationFromInbox(
  conversationId: string,
): Promise<ChatMutationResult> {
  if (isApiDataSource()) {
    return getApiClient().chat.deleteFromInbox({ conversationId });
  }
  await delay(200);
  return { ok: true };
}

export async function fetchReportConversation(
  conversationId: string,
  reason: string,
): Promise<ChatMutationResult> {
  if (isApiDataSource()) {
    return getApiClient().chat.report({ conversationId, reason, type: "other" });
  }
  await delay(300);
  return { ok: true };
}

export async function fetchUpdateParticipantAlias(
  conversationId: string,
  alias: string | null,
): Promise<ChatMutationResult> {
  if (isApiDataSource()) {
    return getApiClient().chat.updateAlias({ conversationId, alias });
  }
  await delay(200);
  return { ok: true };
}

export async function fetchMarkConversationRead(conversationId: string): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().chat.markRead({ conversationId });
    return;
  }
  await delay(100);
}

export async function fetchOpenViewOnce(
  messageId: string,
): Promise<{ openedAt: string; url: string | null }> {
  if (isApiDataSource()) {
    return getApiClient().chat.openViewOnce({ messageId });
  }
  await delay(200);
  return { openedAt: new Date().toISOString(), url: null };
}
