"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { conversations, messages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ChatScreen() {
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const currentMessages = useMemo(() => localMessages.filter((message) => message.conversationId === activeConversation?.id), [activeConversation?.id, localMessages]);

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid min-h-[78vh] md:grid-cols-[300px_1fr]">
          <aside className="border-r border-zinc-200 bg-zinc-50/50">
            <div className="border-b border-zinc-200 bg-white p-4">
              <h1 className="text-lg font-semibold text-zinc-900">Conversas</h1>
            </div>
            <ul className="max-h-[70vh] space-y-3 overflow-auto p-3">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    className={cn(
                      // Adicionado 'cursor-pointer' aqui
                      "w-full cursor-pointer rounded-xl border p-3 text-left transition-all duration-200 hover:border-wine-600 hover:shadow-md",
                      activeConversation?.id === conversation.id
                        ? "border-wine-600 bg-zinc-50 shadow-sm ring-1 ring-wine-600"
                        : "border-zinc-200 bg-white"
                    )}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-zinc-900">{conversation.contactName}</p>
                      <span className="text-xs text-zinc-500">{conversation.lastMessageAt}</span>
                    </div>
                    <p className="mb-2 text-xs text-zinc-500">{conversation.contactStatus}</p>
                    <p className="truncate text-sm text-zinc-600">{conversation.lastMessage}</p>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="relative flex min-h-[70vh] flex-col">
            <header className="border-b border-zinc-200 p-4">
              <p className="text-sm font-semibold text-zinc-900">{activeConversation?.contactName}</p>
              <p className="text-xs text-zinc-500">{activeConversation?.contactStatus}</p>
            </header>
            <div className="flex-1 space-y-3 overflow-auto bg-zinc-50 p-4">
              {currentMessages.map((message) => (
                <div key={message.id} className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", message.from === "me" ? "ml-auto bg-wine-700 text-white" : "bg-white text-zinc-800")}>
                  <p>{message.content}</p>
                  <p className={cn("mt-1 text-[10px]", message.from === "me" ? "text-wine-100" : "text-zinc-400")}>{message.sentAt}</p>
                </div>
              ))}
            </div>
            <form
              className="flex items-center gap-2 border-t border-zinc-200 bg-white p-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim() || !activeConversation) return;
                setLocalMessages((prev) => [...prev, { id: `local-${Date.now()}`, conversationId: activeConversation.id, from: "me", content: draft, sentAt: "agora" }]);
                setDraft("");
              }}
            >
              <Button variant="secondary" type="button" aria-label="Anexar arquivo">+</Button>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Digite sua mensagem" className="h-11 flex-1 rounded-xl border border-zinc-200 px-3 text-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-200" />
              <Button type="submit">Enviar</Button>
            </form>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
