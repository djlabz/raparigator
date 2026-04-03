"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { conversations, messages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Função auxiliar para mapear o status para uma cor do Tailwind
const getStatusColor = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes("online")) return "text-emerald-600";
  if (normalizedStatus.includes("ocupado")) return "text-red-500";
  if (normalizedStatus.includes("ausente")) return "text-amber-500";
  if (normalizedStatus.includes("digitando")) return "text-blue-500";
  if (normalizedStatus.includes("offline")) return "text-zinc-400";
  return "text-zinc-500"; // Cor padrão para status desconhecidos
};

export function ChatScreen() {
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const currentMessages = useMemo(() => localMessages.filter((message) => message.conversationId === activeConversation?.id), [activeConversation?.id, localMessages]);

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl">
        <div className="grid min-h-[78vh] md:grid-cols-[300px_1fr]">

          {/* SIDEBAR */}
          <aside className="border-r border-zinc-200 bg-zinc-50/80 flex flex-col">
            <div className="border-b border-zinc-200 bg-zinc-50/80 p-5">
              <h1 className="text-lg font-bold text-zinc-900 tracking-tight">Conversas</h1>
            </div>
            <ul className="flex-1 space-y-1 overflow-auto p-3">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    className={cn(
                      "w-full cursor-pointer rounded-xl p-3 text-left transition-all duration-200 border",
                      activeConversation?.id === conversation.id
                        ? "bg-white border-zinc-200 shadow-sm ring-1 ring-wine-600/10"
                        : "bg-transparent border-transparent hover:bg-zinc-200/50"
                    )}
                    onClick={() => setActiveConversationId(conversation.id)}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className={cn(
                        "text-sm font-semibold",
                        activeConversation?.id === conversation.id ? "text-wine-700" : "text-zinc-900"
                      )}>
                        {conversation.contactName}
                      </p>
                      <span className="text-[11px] font-medium text-zinc-400">{conversation.lastMessageAt}</span>
                    </div>

                    {/* AQUI ESTÁ A MUDANÇA: Aplicando a cor dinamicamente baseada no status */}
                    <p className={cn(
                      "mb-1.5 text-[10px] font-bold uppercase tracking-wider",
                      getStatusColor(conversation.contactStatus)
                    )}>
                      {conversation.contactStatus}
                    </p>

                    <p className="truncate text-sm text-zinc-600">{conversation.lastMessage}</p>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* MAIN CHAT AREA */}
          <section className="relative flex min-h-[70vh] flex-col bg-zinc-100/80">
            <header className="bg-white border-b border-zinc-200 p-5 z-10 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)]">
              <p className="text-base font-bold text-zinc-900">{activeConversation?.contactName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Opcional: Você pode aplicar a mesma lógica da bolinha verde aqui no header depois, se quiser */}
                <span className="relative flex h-2 w-2">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", activeConversation?.contactStatus.toLowerCase().includes("online") ? "bg-emerald-400" : "bg-zinc-400")}></span>
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", activeConversation?.contactStatus.toLowerCase().includes("online") ? "bg-emerald-500" : "bg-zinc-400")}></span>
                </span>
                <p className="text-xs font-medium text-zinc-500">{activeConversation?.contactStatus}</p>
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-auto p-6">
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col max-w-[75%]",
                    message.from === "me" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm shadow-sm",
                      message.from === "me"
                        ? "bg-wine-700 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white text-zinc-800 border border-zinc-200/60 rounded-2xl rounded-tl-sm"
                    )}
                  >
                    <p className="leading-relaxed">{message.content}</p>
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-zinc-400 px-1">
                    {message.sentAt}
                  </span>
                </div>
              ))}
            </div>

            <form
              className="flex items-center gap-3 bg-white p-4 border-t border-zinc-200"
              onSubmit={(event) => {
                event.preventDefault();
                if (!draft.trim() || !activeConversation) return;
                setLocalMessages((prev) => [...prev, { id: `local-${Date.now()}`, conversationId: activeConversation.id, from: "me", content: draft, sentAt: "agora" }]);
                setDraft("");
              }}
            >
              <Button variant="secondary" className="shrink-0 h-11 w-11 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600" type="button" aria-label="Anexar arquivo">
                +
              </Button>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Escreva sua mensagem..."
                className="h-11 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-sm focus:bg-white focus:border-wine-500 focus:outline-none focus:ring-4 focus:ring-wine-500/10 transition-all"
              />
              <Button type="submit" className="shrink-0 h-11 px-6 rounded-full shadow-sm">
                Enviar
              </Button>
            </form>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
