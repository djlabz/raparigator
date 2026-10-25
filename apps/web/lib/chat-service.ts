import { getApiClient } from "@/lib/api/client";
import type {
  ChatMutationResult,
  Conversation,
  EncounterBrief,
  Message,
} from "@sigillus/contracts";

export async function fetchConversations(): Promise<Conversation[]> {
  return getApiClient().chat.listConversations();
}

export async function fetchMessages(
  conversationId: string,
  options: { before?: string; limit?: number } = {},
): Promise<{ items: Message[]; hasMore: boolean }> {
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
  const result = await getApiClient().chat.sendText({
    conversationId,
    content,
    clientMessageId,
  });
  return result.message;
}

export async function fetchBriefMessage(
  conversationId: string,
  brief: EncounterBrief,
  greeting: string,
  senderDisplayName: string,
  clientMessageId?: string,
): Promise<Message> {
  const result = await getApiClient().chat.sendBrief({
    conversationId,
    brief,
    greeting,
    clientMessageId,
  });
  return result.message;
}

export async function fetchViewOnceMediaMessage(
  conversationId: string,
  senderDisplayName: string,
  assetId?: string,
  clientMessageId?: string,
): Promise<Message> {
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

export async function fetchSetConversationBlocked(
  conversationId: string,
  isBlocked: boolean,
): Promise<ChatMutationResult> {
  return getApiClient().chat.setBlocked({ conversationId, isBlocked });
}

export async function fetchDeleteConversationFromInbox(
  conversationId: string,
): Promise<ChatMutationResult> {
  return getApiClient().chat.deleteFromInbox({ conversationId });
}

export async function fetchReportConversation(
  conversationId: string,
  reason: string,
): Promise<ChatMutationResult> {
  return getApiClient().chat.report({ conversationId, reason, type: "other" });
}

export async function fetchUpdateParticipantAlias(
  conversationId: string,
  alias: string | null,
): Promise<ChatMutationResult> {
  return getApiClient().chat.updateAlias({ conversationId, alias });
}

export async function fetchMarkConversationRead(conversationId: string): Promise<void> {
  await getApiClient().chat.markRead({ conversationId });
}
