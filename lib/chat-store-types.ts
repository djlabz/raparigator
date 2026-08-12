import type { Conversation, Message } from "@/lib/types";

export type ChatSnapshot = {
  conversations: Conversation[];
  messages: Message[];
};

export type ChatMutationReason = "not_found" | "blocked" | "empty" | "adapter_error";

export type ChatMutationResult = { ok: true } | { ok: false; reason: ChatMutationReason };

export type ChatSendResult =
  | { ok: true; messageId: string }
  | { ok: false; reason: ChatMutationReason; messageId?: string };
