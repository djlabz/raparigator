"use client";

import Image from "next/image";
import { useMemo, useState, type Dispatch, type SetStateAction, useRef, useEffect } from "react";
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, mobileConversationOpen]);

  return (
    <AppShell>
      {/* LAYOUT PRINCIPAL (Lista + Desktop Chat)
        Utilizamos height fixo com calc() para impedir que a tela inteira dê scroll,
        forçando o scroll a existir apenas internamente nas áreas específicas.
      */}
      <div className={cn(
        "relative flex w-full flex-col md:flex-row bg-white overflow-hidden md:rounded-2xl md:border md:border-zinc-200/80 md:shadow-xl",
        "h-[calc(100dvh-120px)] md:h-[80vh]"
      )}>

        {/* SIDEBAR: Sempre visível no desktop. Visível no mobile apenas se a conversa não estiver aberta */}
        <aside
          className={cn(
            "flex h-full w-full flex-col border-r border-zinc-200 bg-zinc-50/80 md:w-[320px] lg:w-[360px] shrink-0",
            mobileConversationOpen ? "hidden md:flex" : "flex"
          )}
        >
          <ConversationList
            activeConversationId={activeConversation?.id}
            avatarByConversationId={conversationAvatars}
            onSelectConversation={(conversationId) => {
              setActiveConversationId(conversationId);
              setMobileConversationOpen(true);
            }}
          />
        </aside>

        {/* DESKTOP MAIN CHAT AREA (Oculto no celular) */}
        <section className="hidden md:flex h-full min-w-0 flex-1 flex-col bg-zinc-100/80">
          <ConversationPanel
            conversationName={activeConversation?.contactName ?? "Conversa"}
            conversationStatus={activeConversation?.contactStatus ?? "Offline"}
            avatarSrc={conversationAvatars[activeConversation?.id ?? ""]}
            messagesList={currentMessages}
            draft={draft}
            setDraft={setDraft}
            onSend={appendMessage}
            onBack={() => setMobileConversationOpen(false)}
            messagesEndRef={messagesEndRef}
            isMobile={false}
          />
        </section>
      </div>

      {/* MOBILE FULLSCREEN CHAT AREA
        O "fixed inset-0 z-[100]" cobre todos os headers/footers do AppShell.
        Isso resolve os 2 botões de voltar e trava totalmente o tamanho da tela.
      */}
      {mobileConversationOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-100/80 md:hidden animate-in slide-in-from-right-2 duration-200">
          <ConversationPanel
            conversationName={activeConversation?.contactName ?? "Conversa"}
            conversationStatus={activeConversation?.contactStatus ?? "Offline"}
            avatarSrc={conversationAvatars[activeConversation?.id ?? ""]}
            messagesList={currentMessages}
            draft={draft}
            setDraft={setDraft}
            onSend={appendMessage}
            onBack={() => setMobileConversationOpen(false)}
            messagesEndRef={messagesEndRef}
            isMobile={true}
          />
        </div>
      )}
    </AppShell>
  );
}

function ConversationList({
  activeConversationId,
  avatarByConversationId,
  onSelectConversation,
}: {
  activeConversationId: string | undefined;
  avatarByConversationId: Record<string, string | null>;
  onSelectConversation: (conversationId: string) => void;
}) {
  return (
    <>
      <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/80 p-4 sm:p-5">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Conversas</h1>
      </div>
      {/* O overflow-y-auto garante que o scroll ocorra só na lista */}
      <ul className="flex-1 overflow-y-auto space-y-0.5 p-2">
        {conversations.map((conversation) => {
          const avatarSrc = avatarByConversationId[conversation.id];
          const isActive = activeConversationId === conversation.id;

          return (
            <li key={conversation.id}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 cursor-pointer text-left transition-all duration-200 rounded-xl p-3",
                  isActive ? "bg-white shadow-sm ring-1 ring-zinc-200" : "bg-transparent hover:bg-zinc-200/50"
                )}
                onClick={() => onSelectConversation(conversation.id)}
              >
                {/* ÍCONES PADRONIZADOS - Forma circular travada */}
                <div className="relative h-12 w-12 shrink-0">
                  <div className="h-full w-full overflow-hidden rounded-full bg-zinc-200 ring-1 ring-zinc-200/50">
                    {avatarSrc ? (
                      <Image src={avatarSrc} alt={conversation.contactName} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className={cn("flex h-full w-full items-center justify-center text-lg font-bold uppercase", isActive ? "bg-wine-700 text-white" : "bg-zinc-200 text-zinc-600")}>
                        {conversation.contactName.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <span className={cn("absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white", conversation.contactStatus.toLowerCase().includes("online") ? "bg-emerald-500" : conversation.contactStatus.toLowerCase().includes("ocupado") ? "bg-red-500" : "bg-zinc-400")} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-semibold text-zinc-900">
                      {conversation.contactName}
                    </p>
                    <span className="shrink-0 text-[11px] font-medium text-zinc-400">{conversation.lastMessageAt}</span>
                  </div>
                  <p className={cn("mt-0.5 text-[11px] font-bold uppercase tracking-[0.15em]", getStatusColor(conversation.contactStatus))}>
                    {conversation.contactStatus}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{conversation.lastMessage}</p>
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
  avatarSrc,
  messagesList,
  draft,
  setDraft,
  onSend,
  onBack,
  messagesEndRef,
  isMobile
}: {
  conversationName: string;
  conversationStatus: string;
  avatarSrc: string | null;
  messagesList: Array<(typeof messages)[number]>;
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  onSend: () => void;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-zinc-50 md:bg-zinc-100/80">

      {/* HEADER FIXO DO CHAT */}
      <header className="flex h-[68px] shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-2 shadow-sm z-10">
        {/* Único Botão de Voltar Visível */}
        {isMobile && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Avatar Circular Padronizado */}
        <div className="flex items-center gap-3 min-w-0 flex-1 px-1">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-zinc-200 ring-1 ring-zinc-200/50">
            {avatarSrc ? (
              <Image src={avatarSrc} alt={conversationName} fill className="object-cover" sizes="44px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-lg font-bold uppercase text-zinc-600">
                {conversationName.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-[16px] font-semibold text-zinc-900 leading-snug">{conversationName}</p>
            <p className={cn("truncate text-[13px] font-medium leading-snug", conversationStatus.toLowerCase().includes("online") ? "text-emerald-600" : "text-zinc-500")}>
              {conversationStatus}
            </p>
          </div>
        </div>
      </header>

      {/* ÁREA DE MENSAGENS (Scroll Livre sem afetar o Input) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesList.map((message) => (
          <div
            key={message.id}
            className={cn("flex max-w-[85%] flex-col sm:max-w-[75%]", message.from === "me" ? "ml-auto items-end" : "mr-auto items-start")}
          >
            <div
              className={cn(
                "px-4 py-2.5 text-[15px] shadow-sm break-words",
                message.from === "me"
                  ? "rounded-2xl rounded-tr-sm bg-wine-700 text-white"
                  : "rounded-2xl rounded-tl-sm border border-zinc-200/60 bg-white text-zinc-800"
              )}
            >
              <p className="leading-relaxed">{message.content}</p>
            </div>
            <span className="mt-1 px-1 text-[11px] font-medium text-zinc-400">{message.sentAt}</span>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* INPUT FORM: Fixado na base do contêiner */}
      <form
        className="flex shrink-0 items-end gap-2 bg-zinc-100 p-3 pb-safe md:bg-white md:border-t md:border-zinc-200"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <Button variant="secondary" className="h-12 w-12 shrink-0 rounded-full bg-white text-zinc-600 hover:bg-zinc-50 p-0 flex items-center justify-center shadow-sm" type="button" aria-label="Anexar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </Button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Escreva sua mensagem"
          className="min-h-[48px] min-w-0 flex-1 rounded-3xl border-0 bg-white px-5 py-3 text-[15px] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-wine-500/20"
        />
        <Button type="submit" className="h-12 w-12 shrink-0 rounded-full bg-wine-700 hover:bg-wine-800 text-white shadow-sm flex items-center justify-center p-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
        </Button>
      </form>

    </div>
  );
}
