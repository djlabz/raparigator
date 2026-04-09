"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ads, conversations, messages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/**
 * Cores de status baseadas na disponibilidade da profissional na plataforma
 */
const getStatusColor = (status: string) => {
  const normalized = normalizeText(status);
  if (normalized.includes("online") || normalized.includes("livre")) return "bg-emerald-500";
  if (normalized.includes("atendimento")) return "bg-amber-500";
  return "bg-zinc-400"; // Indisponível/Offline
};

const normalizeText = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export function ChatScreen() {
  const [localConversations, setLocalConversations] = useState(conversations);
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id ?? "");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [conversationParticipantAliases, setConversationParticipantAliases] = useState<Record<string, string>>({});
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [localMessages, setLocalMessages] = useState(messages);
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);

  const activeConversation = localConversations.find((c) => c.id === activeConversationId) || localConversations[0];
  const displayContactName = activeConversation?.contactName ?? "";
  const participantAlias = activeConversation ? (conversationParticipantAliases[activeConversation.id] ?? "") : "";

  const activeAd = useMemo(() => {
    if (!activeConversation) return null;

    return ads.find((ad) => normalizeText(ad.artisticName).includes(normalizeText(activeConversation.contactName))) ?? null;
  }, [activeConversation]);

  const currentMessages = useMemo(() =>
    localMessages.filter((m) => m.conversationId === activeConversation?.id),
    [activeConversation?.id, localMessages]
  );

  // Mapeia avatares baseados nos anúncios (Ads)
  const conversationAvatars = useMemo(() => {
    return Object.fromEntries(
      localConversations.map((c) => {
        const ad = ads.find((a) => normalizeText(a.artisticName).includes(normalizeText(c.contactName)));
        return [c.id, ad?.images[0] ?? null];
      })
    );
  }, [localConversations]);

  useEffect(() => {
    if (!activeConversationId && localConversations[0]?.id) {
      setActiveConversationId(localConversations[0].id);
      return;
    }

    if (activeConversationId && !localConversations.some((conversation) => conversation.id === activeConversationId)) {
      setActiveConversationId(localConversations[0]?.id ?? "");
    }
  }, [activeConversationId, localConversations]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !activeConversation) return;

    const messageId = `local-${Date.now()}`;

    setLocalMessages((prev) => [
      ...prev,
      { id: messageId, conversationId: activeConversation.id, from: "me", content, sentAt: "agora" }
    ]);

    setLocalConversations((prev) => prev.map((conversation) => (
      conversation.id === activeConversation.id
        ? { ...conversation, lastMessage: content, lastMessageAt: "agora", unread: 0 }
        : conversation
    )));

    setLastSentMessageId(messageId);
    setDraft("");
  };

  // Scroll automático para a última mensagem
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, mobileConversationOpen]);

  useEffect(() => {
    if (!lastSentMessageId) return;

    const timeout = window.setTimeout(() => setLastSentMessageId(null), 420);
    return () => window.clearTimeout(timeout);
  }, [lastSentMessageId]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;

    // Keep chat shell fixed and allow scrolling only in inner panes.
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscrollBehavior;
    };
  }, []);

  const openConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMobileConversationOpen(isMobileViewport);
    setProfilePanelOpen(false);
    setRenameModalOpen(false);
  };

  const openRenameModal = () => {
    if (!activeConversation) return;

    setRenameDraft(conversationParticipantAliases[activeConversation.id] ?? "");
    setRenameModalOpen(true);
    setProfilePanelOpen(false);
  };

  const saveParticipantAlias = () => {
    if (!activeConversation) return;

    const sanitized = renameDraft.trim();
    setConversationParticipantAliases((prev) => {
      const next = { ...prev };

      if (!sanitized) {
        delete next[activeConversation.id];
        return next;
      }

      next[activeConversation.id] = sanitized;
      return next;
    });

    setRenameModalOpen(false);
  };

  const handleDeleteConversation = () => {
    if (!activeConversation) return;
    if (!window.confirm(`Deseja excluir a conversa com ${displayContactName}?`)) return;

    const conversationId = activeConversation.id;
    setLocalConversations((prev) => prev.filter((conversation) => conversation.id !== conversationId));
    setLocalMessages((prev) => prev.filter((message) => message.conversationId !== conversationId));
    setConversationParticipantAliases((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
    setProfilePanelOpen(false);
    setRenameModalOpen(false);
    setMobileConversationOpen(false);
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Ola ${activeConversation?.contactName ?? ""}, vim pelo Sigillus.`)}`;

  return (
    <AppShell hideMobileBottomNav={isMobileViewport && mobileConversationOpen}>
      <div className={cn(
        "relative flex w-full min-h-0 flex-col overflow-hidden bg-white md:grid md:grid-cols-[340px_minmax(0,1fr)] md:rounded-[28px] md:border md:border-zinc-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        "h-[calc(100dvh-168px)] md:h-[calc(100dvh-11rem)]"
      )}>

        {/* LISTA DE CONVERSAS (Sidebar) */}
        <aside className={cn(
          "flex h-full min-h-0 w-full flex-col border-b border-zinc-200 bg-zinc-50/80 md:border-b-0 md:border-r md:shrink-0",
          isMobileViewport && mobileConversationOpen ? "hidden md:flex" : "flex"
        )}>
          <div className="border-b border-zinc-200 bg-white/80 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Conversas</h1>
              </div>
              <span className="rounded-full bg-wine-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-wine-700">
                {localConversations.length} conversas
              </span>
            </div>
          </div>
          <ul className="flex-1 space-y-2 overflow-y-auto p-3">
            {localConversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => openConversation(c.id)}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200",
                    activeConversationId === c.id
                      ? "border-wine-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-wine-500/10"
                      : "border-transparent bg-transparent hover:border-zinc-200 hover:bg-white/80 hover:shadow-sm"
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0">
                    <Image src={conversationAvatars[c.id] || "/placeholder.png"} alt={c.contactName} fill className="rounded-full object-cover border border-zinc-100" />
                    <span className={cn("absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white", getStatusColor(c.contactStatus))} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-zinc-900 truncate group-hover:text-wine-800">{c.contactName}</p>
                      <span className="text-[10px] text-zinc-400 font-medium">{c.lastMessageAt}</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{c.lastMessage}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* ÁREA DO CHAT (Mobile Fullscreen ou Desktop Main) */}
        <section className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-100/50 overscroll-none",
          isMobileViewport && mobileConversationOpen ? "fixed inset-0 md:relative md:z-auto md:h-auto md:min-h-0 md:flex" : "hidden md:flex"
        )}
          style={isMobileViewport && mobileConversationOpen ? { zIndex: 120, height: "100dvh", minHeight: "100dvh" } : undefined}
        >
          {/* HEADER DO CHAT */}
          <header className="flex items-center gap-3 border-b border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm md:p-5">
            {/* Lógica do botão de voltar customizada */}
            <div className="md:hidden">
              <button onClick={() => { setMobileConversationOpen(false); setProfilePanelOpen(false); }} className="p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            </div>

            <button type="button" className="flex flex-1 items-center gap-3 cursor-pointer group text-left" onClick={() => setProfilePanelOpen(true)}>
              <div className="relative h-10 w-10">
                <Image src={conversationAvatars[activeConversationId] || "/placeholder.png"} alt="Avatar" fill className="rounded-full object-cover" />
                <span className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white", getStatusColor(activeConversation?.contactStatus || ""))} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 truncate leading-none">{displayContactName}</p>
                <p className="text-[11px] font-medium text-zinc-500 mt-1 uppercase tracking-wider">{activeConversation?.contactStatus}</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProfilePanelOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full"
              aria-label="Abrir opcoes do contato"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </header>

          <div
            className={cn(
              "absolute inset-0 z-20 bg-zinc-900/30 px-3 transition-opacity duration-200 md:px-5",
              profilePanelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={() => setProfilePanelOpen(false)}
          >
            <div
              className={cn(
                "mt-20 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl transition-all duration-250 ease-out md:ml-auto md:mr-4 md:mt-6 md:w-90",
                profilePanelOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.98] opacity-0"
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-2 pb-2">
                <p className="text-sm font-bold text-zinc-900 truncate">{displayContactName}</p>
                <p className="text-xs uppercase tracking-wider text-zinc-400 mt-1">Acoes da conversa</p>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={openRenameModal}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Alterar apelido para essa conversa
                </button>

                {activeAd ? (
                  <Link
                    href={`/anuncio/${activeAd.slug}`}
                    onClick={() => setProfilePanelOpen(false)}
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Ver anuncio publico
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-400"
                  >
                    Ver anuncio publico
                  </button>
                )}

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Ir para whatsapp
                </a>

                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                  Excluir conversa
                </button>
              </div>

              <div className="mt-2 border-t border-zinc-100 px-2 pt-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Seu apelido para esse contato</p>
                <p className="mt-1 text-sm font-semibold text-zinc-700">{participantAlias || "Nao definido"}</p>
              </div>
            </div>
          </div>

          {/* MENSAGENS */}
          <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),rgba(248,250,252,0.92)_38%,rgba(244,244,245,1)_100%)] p-4 md:p-6 space-y-4">
            {currentMessages.map((m) => (
              <div key={m.id} className={cn(
                "flex flex-col max-w-[85%] md:max-w-[68%]",
                m.from === "me" ? "ml-auto items-end" : "mr-auto items-start",
                m.from === "me" && m.id === lastSentMessageId ? "message-sent-pop" : ""
              )}>
                <div className={cn(
                  "px-4 py-2.5 text-sm shadow-sm",
                  m.from === "me" ? "bg-wine-700 text-white rounded-2xl rounded-tr-sm shadow-[0_10px_22px_rgba(182,0,49,0.18)]" : "bg-white text-zinc-800 border border-zinc-200/60 rounded-2xl rounded-tl-sm"
                )}>
                  <p className="leading-relaxed">{m.content}</p>
                </div>
                <span className="mt-1 text-[10px] text-zinc-400 font-medium px-1 uppercase">{m.sentAt}</span>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {/* INPUT FORM */}
          <form className="border-t border-zinc-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <div className="flex items-center gap-3 max-w-5xl mx-auto">
              <button type="button" className="h-10 w-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center font-bold text-xl hover:bg-zinc-200 transition-colors">+</button>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Mensagem..."
                className="flex-1 h-11 bg-zinc-50 border border-zinc-200 rounded-full px-5 text-sm focus:outline-none focus:border-wine-500 focus:bg-white transition-all shadow-sm"
              />
              <Button type="submit" className="h-11 px-6 rounded-full font-bold">Enviar</Button>
            </div>
          </form>
        </section>
      </div>

      <Modal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Seu apelido para essa conversa"
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setRenameModalOpen(false)}>
              Cancelar
            </Button>
            <Button fullWidth onClick={saveParticipantAlias}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label htmlFor="conversation-alias" className="text-sm font-semibold text-zinc-800">Apelido</label>
          <input
            id="conversation-alias"
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            placeholder="Ex: Cliente VIP"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
            maxLength={40}
            autoFocus
          />
          <p className="text-xs text-zinc-500">Deixe vazio para remover o apelido.</p>
        </div>
      </Modal>
    </AppShell>
  );
}
