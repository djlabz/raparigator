import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORPCError } from "@orpc/client";

const subscribe = vi.fn();
const listConversations = vi.fn();

vi.mock("@/lib/api/client", () => ({
  getApiClient: () => ({ chat: { subscribe, listConversations, listMessages: vi.fn() } }),
}));

async function flush() {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve();
  }
}

describe("chat store sem sessão e com rede instável", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {});
    subscribe.mockReset();
    listConversations.mockReset();
    listConversations.mockResolvedValue([]);
  });

  afterEach(async () => {
    const store = await import("@/lib/chat-store");
    store.resetChatStore();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.resetModules();
  });

  it("401 na assinatura: uma tentativa só, sem reagendar, e lastError marcado", async () => {
    subscribe.mockRejectedValue(new ORPCError("UNAUTHORIZED"));
    listConversations.mockRejectedValue(new ORPCError("UNAUTHORIZED"));
    const store = await import("@/lib/chat-store");
    store.ensureChatStore();
    await flush();
    expect(subscribe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(listConversations).toHaveBeenCalledTimes(1);
    expect(store.getChatStoreSnapshot().lastError).toBe("unauthenticated");
  });

  it("erro de rede na assinatura: reconecta com backoff", async () => {
    subscribe.mockRejectedValue(new TypeError("fetch failed"));
    listConversations.mockRejectedValue(new TypeError("fetch failed"));
    const store = await import("@/lib/chat-store");
    store.ensureChatStore();
    await flush();
    expect(subscribe).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1_100);
    expect(subscribe).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2_100);
    expect(subscribe).toHaveBeenCalledTimes(3);
    expect(store.getChatStoreSnapshot().lastError).toBe("network");
  });

  it("ensureChatStore desligado não chama a API", async () => {
    const store = await import("@/lib/chat-store");
    store.ensureChatStore({ enabled: false });
    await flush();
    expect(subscribe).not.toHaveBeenCalled();
    expect(listConversations).not.toHaveBeenCalled();
  });
});
