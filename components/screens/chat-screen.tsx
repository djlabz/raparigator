"use client";

import Image from "next/image";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ads, conversations, messages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus.includes("online")) return "text-emerald-600";
  if (normalizedStatus.includes("ocupado")) return "text-red-500";
  if (normalizedStatus.includes("ausente")) return "text-amber-500";
  if (normalizedStatus.includes("digitando")) return "text-blue-500";
  if (normalizedStatus.includes("offline")) return "text-zinc-400";
  return "text-zinc-500";
};

const normalizeText = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export function ChatScreen() {
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id ?? "");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);

  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0];
  const currentMessages = useMemo(() => localMessages.filter((message) => message.conversationId === activeConversation?.id), [activeConversation?.id, localMessages]);

  const conversationAvatars = useMemo(() => {
    return Object.fromEntries(
      conversations.map((conversation) => {
        const normalizedConversationName = normalizeText(conversation.contactName);
        const matchedAd = ads.find((ad) => {
          const normalizedArtisticName = normalizeText(ad.artisticName);
          return normalizedArtisticName === normalizedConversationName || normalizedConversationName.includes(normalizedArtisticName) || normalizedArtisticName.includes(normalizedConversationName);
        });

        return [conversation.id, matchedAd?.images[0] ?? null];
      })
    ) as Record<string, string | null>;
  }, []);

  const appendMessage = () => {
    if (!draft.trim() || !activeConversation) return;
    setLocalMessages((prev) => [...prev, { id: `local-${Date.now()}`, conversationId: activeConversation.id, from: "me", content: draft, sentAt: "agora" }]);
    setDraft("");
  };

  return (
    <AppShell>
      <div className="md:overflow-hidden md:rounded-2xl md:border md:border-zinc-200/80 md:bg-white md:shadow-xl">
        <div className="hidden min-h-[78vh] md:grid md:grid-cols-[300px_1fr]">
          <ConversationList
            activeConversationId={activeConversation?.id}
            avatarByConversationId={conversationAvatars}
            onSelectConversation={setActiveConversationId}
          />

          <ConversationPanel
            conversationName={activeConversation?.contactName ?? "Conversa"}
            conversationStatus={activeConversation?.contactStatus ?? "Offline"}
            messagesList={currentMessages}
            draft={draft}
            setDraft={setDraft}
            onSend={appendMessage}
          />
        </div>

        <div className="relative min-h-[78vh] overflow-hidden md:hidden">
          <aside
            className={cn(
              "absolute inset-0 flex flex-col bg-white transition-all duration-300",
              mobileConversationOpen ? "-translate-x-1/4 opacity-0" : "translate-x-0 opacity-100"
            )}
          >
            <ConversationList
              activeConversationId={activeConversation?.id}
              avatarByConversationId={conversationAvatars}
              compact
              onSelectConversation={(conversationId) => {
                setActiveConversationId(conversationId);
                setMobileConversationOpen(true);
              }}
            />
          </aside>

          <section
            className={cn(
              "absolute inset-0 z-10 transition-transform duration-300",
              mobileConversationOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <ConversationPanel
              conversationName={activeConversation?.contactName ?? "Conversa"}
              conversationStatus={activeConversation?.contactStatus ?? "Offline"}
              messagesList={currentMessages}
              draft={draft}
              setDraft={setDraft}
              onSend={appendMessage}
              showMobileBack
              onBack={() => setMobileConversationOpen(false)}
            />
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function ConversationList({
  activeConversationId,
  avatarByConversationId,
  compact = false,
  onSelectConversation,
}: {
  activeConversationId: string | undefined;
  avatarByConversationId: Record<string, string | null>;
  compact?: boolean;
  onSelectConversation: (conversationId: string) => void;
}) {
  return (
    <>
      <div className={cn("p-4 sm:p-5", compact ? "border-b border-zinc-100 bg-white" : "border-b border-zinc-200 bg-zinc-50/80")}>
        <h1 className="text-lg font-bold tracking-tight text-zinc-900">Conversas</h1>
      </div>
      <ul className={cn("flex-1 overflow-auto", compact ? "divide-y divide-zinc-100" : "space-y-1 p-2 sm:p-3")}>
        {conversations.map((conversation) => {
          const avatarSrc = avatarByConversationId[conversation.id];
          const isActive = activeConversationId === conversation.id;

          return (
            <li key={conversation.id}>
              <button
                className={cn(
                  "w-full cursor-pointer text-left transition-all duration-200",
                  compact ? "px-4 py-4" : "rounded-xl border p-3",
                  compact
                    ? isActive
                      ? "bg-wine-50/70"
                      : "bg-white hover:bg-zinc-50"
                    : isActive
                      ? "border-zinc-200 bg-white shadow-sm ring-1 ring-wine-600/10"
                      : "border-transparent bg-transparent hover:bg-zinc-200/50"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-1 ring-zinc-200">
                    {avatarSrc ? (
                      <Image src={avatarSrc} alt={conversation.contactName} fill className="object-cover object-center scale-x-[-1]" sizes="44px" />
                    ) : (
                      <div className={cn("flex h-full w-full items-center justify-center rounded-full text-sm font-bold uppercase", isActive ? "bg-wine-700 text-white" : "bg-zinc-200 text-zinc-600")}>
                        {conversation.contactName.slice(0, 1)}
                      </div>
                    )}
                    <span className={cn("absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-50", conversation.contactStatus.toLowerCase().includes("online") ? "bg-emerald-500" : conversation.contactStatus.toLowerCase().includes("ocupado") ? "bg-red-500" : "bg-zinc-400")} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm font-semibold", isActive ? "text-wine-700" : "text-zinc-900")}>
                        {conversation.contactName}
                      </p>
                      <span className="shrink-0 text-[11px] font-medium text-zinc-400">{conversation.lastMessageAt}</span>
                    </div>

                    <p className={cn("mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em]", getStatusColor(conversation.contactStatus))}>
                      {conversation.contactStatus}
                    </p>

                    <p className="mt-1 truncate text-sm text-zinc-600">{conversation.lastMessage}</p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function ConversationPanel({
  conversationName,
  conversationStatus,
  messagesList,
  draft,
  setDraft,
  onSend,
  showMobileBack = false,
  onBack,
}: {
  conversationName: string;
  conversationStatus: string;
  messagesList: Array<(typeof messages)[number]>;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  onSend: () => void;
  showMobileBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="relative flex min-h-[78vh] flex-col bg-zinc-100/80 md:min-h-[70vh]">
      <header className="z-10 border-b border-zinc-200 bg-white p-4 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)] sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-zinc-900">{conversationName}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", conversationStatus.toLowerCase().includes("online") ? "animate-ping bg-emerald-400" : "bg-zinc-400")} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", conversationStatus.toLowerCase().includes("online") ? "bg-emerald-500" : "bg-zinc-400")} />
              </span>
              <p className="text-xs font-medium text-zinc-500">{conversationStatus}</p>
            </div>
          </div>
          {showMobileBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Conversas
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-auto p-4 sm:p-6">
        {messagesList.map((message) => (
          <div
            key={message.id}
            className={cn("flex max-w-[88%] flex-col sm:max-w-[75%]", message.from === "me" ? "ml-auto items-end" : "mr-auto items-start")}
          >
            <div
              className={cn(
                "px-4 py-2.5 text-sm shadow-sm",
                message.from === "me"
                  ? "rounded-2xl rounded-tr-sm bg-wine-700 text-white"
                  : "rounded-2xl rounded-tl-sm border border-zinc-200/60 bg-white text-zinc-800"
              )}
            >
              <p className="leading-relaxed">{message.content}</p>
            </div>
            <span className="mt-1.5 px-1 text-[11px] font-medium text-zinc-400">{message.sentAt}</span>
          </div>
        ))}
      </div>

      <form
        className="flex flex-col gap-3 border-t border-zinc-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <Button variant="secondary" className="h-11 w-11 shrink-0 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200" type="button" aria-label="Anexar arquivo">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 0 1-7.78-7.78l8.49-8.49a3.5 3.5 0 0 1 4.95 4.95l-8.49 8.49a1.5 1.5 0 1 1-2.12-2.12l7.78-7.78" />
          </svg>
        </Button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva sua mensagem..."
          className="h-11 min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm transition-all focus:border-wine-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-wine-500/10"
        />
        <Button type="submit" className="h-11 w-full shrink-0 rounded-full px-6 shadow-sm sm:w-auto">
          Enviar
        </Button>
      </form>
    </div>
  );
}
