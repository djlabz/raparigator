"use client";

import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Flag,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCcw,
  Send,
  Shield,
  Trash2,
  UserRound,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AppShell } from "../layout/app-shell";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PremiumConversionModal, type PremiumHighlight } from "@/components/ui/premium-conversion-modal";
import { Toast } from "@/components/ui/toast";
import { chromeCircle } from "@/lib/chrome-styles";
import {
  deleteConversationFromInbox as apiDeleteConversationFromInbox,
  getCachedChatSnapshot,
  getChatSnapshot,
  publishChatSnapshot,
  reportConversation as apiReportConversation,
  sendTextMessage,
  sendViewOnceMediaMessage,
  setConversationBlocked as apiSetConversationBlocked,
  updateParticipantAlias as apiUpdateParticipantAlias,
} from "@/lib/chat-service";
import { ads } from "@/lib/mock-data";
import type { AvailabilityStatus, Conversation, Message, ProfessionalAd } from "@/lib/types";
import { useAuthSession } from "@/lib/auth-session";
import { usePremiumPlan } from "@/lib/premium-plan";
import { cn } from "@/lib/utils";

const normalizeText = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const getStatusColor = (status: Conversation["contactStatus"]) => status === "online" ? "bg-emerald-500" : "bg-zinc-400";
const getStatusLabel = (status: Conversation["contactStatus"]) => status === "online" ? "Online" : "Offline";

const PROFESSIONAL_AVAILABILITY_STORAGE_KEY = "sigillus-professional-chat-availability";
const PROFESSIONAL_AVAILABILITY_PANEL_STORAGE_KEY = "sigillus-professional-availability-panel-open";

const professionalAvailabilityOptions: {
  value: AvailabilityStatus;
  label: string;
  description: string;
  dotClass: string;
  activeClass: string;
}[] = [
    {
      value: "livre",
      label: "Disponível",
      description: "Seu status aparece disponível para novos contatos.",
      dotClass: "bg-emerald-500",
      activeClass: "ring-emerald-200 bg-emerald-50 text-emerald-800",
    },
    {
      value: "em_atendimento",
      label: "Ocupado",
      description: "Seu status aparece como em atendimento.",
      dotClass: "bg-amber-500",
      activeClass: "ring-amber-200 bg-amber-50 text-amber-800",
    },
    {
      value: "indisponivel",
      label: "Indisponível",
      description: "Seu status aparece como indisponível.",
      dotClass: "bg-zinc-400",
      activeClass: "ring-zinc-300 bg-zinc-100 text-zinc-700",
    },
  ];

function readProfessionalAvailability(): AvailabilityStatus {
  if (typeof window === "undefined") {
    return "livre";
  }

  const stored = window.localStorage.getItem(PROFESSIONAL_AVAILABILITY_STORAGE_KEY);
  if (stored === "livre" || stored === "em_atendimento" || stored === "indisponivel") {
    return stored;
  }

  return "livre";
}

function saveProfessionalAvailability(status: AvailabilityStatus) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFESSIONAL_AVAILABILITY_STORAGE_KEY, status);
  }
}

function getProfessionalAvailabilityOption(status: AvailabilityStatus) {
  return professionalAvailabilityOptions.find((item) => item.value === status) ?? professionalAvailabilityOptions[0];
}

function getProfessionalAvailabilityDescription(status: AvailabilityStatus) {
  return getProfessionalAvailabilityOption(status).description;
}

function readAvailabilityPanelOpen(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PROFESSIONAL_AVAILABILITY_PANEL_STORAGE_KEY) === "true";
}

function saveAvailabilityPanelOpen(open: boolean) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PROFESSIONAL_AVAILABILITY_PANEL_STORAGE_KEY, open ? "true" : "false");
  }
}

const getMessageStatus = (message: Message) => {
  if (message.from !== "me") return null;

  if (message.status === "sending") return { label: "Enviando", icon: Clock, className: "text-zinc-400" };
  if (message.status === "failed") return { label: "Falhou", icon: AlertCircle, className: "text-wine-600" };
  if (message.status === "delivered") return { label: "Entregue", icon: CheckCheck, className: "text-zinc-400" };
  return { label: "Enviada", icon: Check, className: "text-zinc-400" };
};

type ToastState = { title: string; message: string; type?: "success" | "error" | "info" } | null;

export function ChatScreen() {
  const { isLoggedIn, user, role } = useAuthSession();
  const { isPremium, canSendViewOnce } = usePremiumPlan();
  const initialSnapshot = getCachedChatSnapshot();
  const [localConversations, setLocalConversations] = useState<Conversation[]>(() => initialSnapshot?.conversations ?? []);
  const [localMessages, setLocalMessages] = useState<Message[]>(() => initialSnapshot?.messages ?? []);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [mobileConversationOpen, setMobileConversationOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [draft, setDraft] = useState("");
  const [lastSentMessageId, setLastSentMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => !initialSnapshot);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [globalAlias, setGlobalAlias] = useState(user?.alias ?? "Cliente reservado");
  const [globalAliasDraft, setGlobalAliasDraft] = useState(globalAlias);
  const [globalAliasModalOpen, setGlobalAliasModalOpen] = useState(false);
  const [presenceVisible, setPresenceVisible] = useState(true);
  const [professionalAvailability, setProfessionalAvailability] = useState<AvailabilityStatus>(() => readProfessionalAvailability());
  const [availabilityPanelOpen, setAvailabilityPanelOpen] = useState(() => readAvailabilityPanelOpen());
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [viewOnceModalOpen, setViewOnceModalOpen] = useState(false);
  const [premiumUpsellOpen, setPremiumUpsellOpen] = useState(false);
  const [premiumUpsellHighlight, setPremiumUpsellHighlight] = useState<PremiumHighlight>("media");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const activeAvailabilityOption = getProfessionalAvailabilityOption(professionalAvailability);

  const activeConversation = localConversations.find((conversation) => conversation.id === activeConversationId) ?? localConversations[0];
  const displayContactName = activeConversation?.contactName ?? "";
  const participantAlias = activeConversation?.currentUserAlias ?? "";
  const currentDisplayName = participantAlias || globalAlias || "Cliente reservado";

  const activeAd = useMemo(() => {
    if (!activeConversation) return null;
    return ads.find((ad) => normalizeText(ad.artisticName).includes(normalizeText(activeConversation.contactName))) ?? null;
  }, [activeConversation]);

  const currentMessages = useMemo(() =>
    localMessages.filter((message) => message.conversationId === activeConversation?.id && !message.deletedAt),
    [activeConversation?.id, localMessages]
  );

  const conversationAvatars = useMemo(() => {
    return Object.fromEntries(
      localConversations.map((conversation) => {
        const ad = ads.find((item) => normalizeText(item.artisticName).includes(normalizeText(conversation.contactName)));
        return [conversation.id, ad?.images[0] ?? null];
      })
    );
  }, [localConversations]);

  const visibleConversations = useMemo(
    () => localConversations.filter((conversation) => !conversation.deletedFromInboxAt),
    [localConversations]
  );

  const showToast = (payload: NonNullable<ToastState>) => {
    setToast(payload);
    window.setTimeout(() => setToast(null), 3600);
  };

  const loadChat = async (options?: { showLoading?: boolean }) => {
    const showLoading = options?.showLoading ?? !getCachedChatSnapshot();

    if (showLoading) {
      setIsLoading(true);
    }

    setLoadError(null);

    try {
      const snapshot = await getChatSnapshot();
      setLocalConversations(snapshot.conversations);
      setLocalMessages(snapshot.messages);
      setActiveConversationId((current) => current || snapshot.conversations[0]?.id || "");
    } catch {
      setLoadError("Não foi possível carregar suas conversas agora.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    setGlobalAlias(user?.alias ?? "Cliente reservado");
  }, [user?.alias]);

  useEffect(() => {
    if (!activeConversationId && visibleConversations[0]?.id) {
      setActiveConversationId(visibleConversations[0].id);
      return;
    }

    if (activeConversationId && !visibleConversations.some((conversation) => conversation.id === activeConversationId)) {
      setActiveConversationId(visibleConversations[0]?.id ?? "");
    }
  }, [activeConversationId, visibleConversations]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateViewport = () => {
      setIsMobileViewport(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || !mobileConversationOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscrollBehavior = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscrollBehavior = document.documentElement.style.overscrollBehavior;

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
  }, [isMobileViewport, mobileConversationOpen]);

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
    if (localConversations.length === 0 && localMessages.length === 0) {
      return;
    }

    publishChatSnapshot(localConversations, localMessages);
  }, [localConversations, localMessages]);

  const markConversationAsRead = (conversationId: string) => {
    setLocalConversations((previous) => {
      const conversation = previous.find((item) => item.id === conversationId);
      if (!conversation || conversation.unread === 0) {
        return previous;
      }

      return previous.map((item) => (
        item.id === conversationId ? { ...item, unread: 0 } : item
      ));
    });
  };

  const syncConversationPreview = (conversationId: string, lastMessage: string) => {
    setLocalConversations((previous) => previous.map((conversation) => (
      conversation.id === conversationId
        ? { ...conversation, lastMessage, lastMessageAt: "agora", unread: 0 }
        : conversation
    )));
  };

  const openConversation = (conversationId: string) => {
    markConversationAsRead(conversationId);
    setActiveConversationId(conversationId);
    setMobileConversationOpen(isMobileViewport);
    setProfilePanelOpen(false);
    setRenameModalOpen(false);
    setAttachmentMenuOpen(false);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !activeConversation || activeConversation.isBlocked) return;

    const optimisticId = `local-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversationId: activeConversation.id,
      senderId: "current-user",
      senderRole: "cliente",
      senderDisplayName: currentDisplayName,
      from: "me",
      content,
      messageType: "text",
      status: "sending",
      sentAt: "agora",
      deliveredAt: null,
      editedAt: null,
      deletedAt: null,
    };

    setLocalMessages((previous) => [...previous, optimisticMessage]);
    syncConversationPreview(activeConversation.id, content);
    setLastSentMessageId(optimisticId);
    setDraft("");

    try {
      const confirmed = await sendTextMessage(activeConversation.id, content, currentDisplayName);
      setLocalMessages((previous) => previous.map((message) => (
        message.id === optimisticId ? confirmed : message
      )));
      setLastSentMessageId(confirmed.id);
    } catch {
      setLocalMessages((previous) => previous.map((message) => (
        message.id === optimisticId ? { ...message, status: "failed" } : message
      )));
    }
  };

  const openPremiumUpsell = (highlight: PremiumHighlight) => {
    setPremiumUpsellHighlight(highlight);
    setPremiumUpsellOpen(true);
  };

  const handleOpenViewOnceModal = () => {
    if (!canSendViewOnce) {
      setAttachmentMenuOpen(false);
      openPremiumUpsell("media");
      return;
    }

    setViewOnceModalOpen(true);
  };

  const handleSendViewOnceMedia = async () => {
    if (!activeConversation || activeConversation.isBlocked) return;

    if (!canSendViewOnce) {
      setViewOnceModalOpen(false);
      openPremiumUpsell("media");
      return;
    }

    const optimisticId = `local-media-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversationId: activeConversation.id,
      senderId: "current-user",
      senderRole: "cliente",
      senderDisplayName: currentDisplayName,
      from: "me",
      messageType: "media",
      status: "sending",
      media: {
        id: `local-asset-${Date.now()}`,
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

    setLocalMessages((previous) => [...previous, optimisticMessage]);
    syncConversationPreview(activeConversation.id, "Mídia temporária");
    setLastSentMessageId(optimisticId);
    setViewOnceModalOpen(false);
    setAttachmentMenuOpen(false);

    try {
      const confirmed = await sendViewOnceMediaMessage(activeConversation.id, currentDisplayName);
      setLocalMessages((previous) => previous.map((message) => (
        message.id === optimisticId ? confirmed : message
      )));
      setLastSentMessageId(confirmed.id);
      showToast({ title: "Mídia temporária enviada", message: "Ela aparecerá como visualização única na conversa.", type: "success" });
    } catch {
      setLocalMessages((previous) => previous.map((message) => (
        message.id === optimisticId ? { ...message, status: "failed" } : message
      )));
    }
  };

  const openRenameModal = () => {
    if (!activeConversation) return;

    if (!isPremium) {
      setProfilePanelOpen(false);
      openPremiumUpsell("alias");
      return;
    }

    setRenameDraft(activeConversation.currentUserAlias ?? "");
    setRenameModalOpen(true);
    setProfilePanelOpen(false);
  };

  const openGlobalAliasModal = () => {
    setGlobalAliasDraft(globalAlias);
    setGlobalAliasModalOpen(true);
  };

  const saveParticipantAlias = async () => {
    if (!activeConversation) return;

    const sanitized = renameDraft.trim();
    // Optimistic update
    setLocalConversations((previous) => previous.map((conversation) => (
      conversation.id === activeConversation.id
        ? { ...conversation, currentUserAlias: sanitized || undefined }
        : conversation
    )));
    setRenameModalOpen(false);
    showToast({ title: "Apelido atualizado", message: sanitized ? "Este apelido será usado nesta conversa." : "A conversa voltou a usar seu apelido geral.", type: "success" });

    // Persist via service (no-op em mock, chamada real quando backend estiver pronto)
    try {
      await apiUpdateParticipantAlias(activeConversation.id, sanitized || null);
    } catch {
      // Silencia no modo mock; em produção, considerar reverter o estado ou logar o erro
    }
  };

  const saveGlobalAlias = () => {
    const sanitized = globalAliasDraft.trim() || "Cliente reservado";
    setGlobalAlias(sanitized);
    setGlobalAliasDraft(sanitized);
    setGlobalAliasModalOpen(false);
    showToast({ title: "Apelido geral atualizado", message: "Novas conversas usarão esse nome de exibição.", type: "success" });
  };

  const handleDeleteFromInbox = async () => {
    if (!activeConversation) return;

    const conversationId = activeConversation.id;
    const now = new Date().toISOString();
    // Optimistic update
    setLocalConversations((previous) => previous.map((conversation) => (
      conversation.id === conversationId ? { ...conversation, deletedFromInboxAt: now } : conversation
    )));
    setProfilePanelOpen(false);
    setDeleteModalOpen(false);
    setMobileConversationOpen(false);
    showToast({ title: "Conversa removida", message: "Ela saiu da sua caixa de entrada.", type: "success" });

    try {
      await apiDeleteConversationFromInbox(conversationId);
    } catch {
      // Silencia no modo mock; em produção, considerar reverter o estado
    }
  };

  const handleBlockUser = async () => {
    if (!activeConversation) return;

    // Optimistic update
    setLocalConversations((previous) => previous.map((conversation) => (
      conversation.id === activeConversation.id ? { ...conversation, isBlocked: true } : conversation
    )));
    setProfilePanelOpen(false);
    setBlockModalOpen(false);
    showToast({ title: "Usuário bloqueado", message: "Novas mensagens ficam desativadas nesta conversa.", type: "success" });

    try {
      await apiSetConversationBlocked(activeConversation.id, true);
    } catch {
      // Silencia no modo mock
    }
  };

  const handleUnblockUser = async () => {
    if (!activeConversation) return;

    // Optimistic update
    setLocalConversations((previous) => previous.map((conversation) => (
      conversation.id === activeConversation.id ? { ...conversation, isBlocked: false } : conversation
    )));
    setProfilePanelOpen(false);
    setBlockModalOpen(false);
    showToast({ title: "Usuário desbloqueado", message: "O envio de mensagens foi reativado nesta conversa.", type: "success" });

    try {
      await apiSetConversationBlocked(activeConversation.id, false);
    } catch {
      // Silencia no modo mock
    }
  };

  const handleReportConversation = async () => {
    if (!activeConversation) return;

    const reason = reportReason.trim();
    setReportModalOpen(false);
    setProfilePanelOpen(false);
    setReportReason("");
    showToast({ title: "Denúncia registrada", message: "A denúncia foi enviada para análise pela equipe.", type: "success" });

    try {
      await apiReportConversation(activeConversation.id, reason);
    } catch {
      // Silencia no modo mock
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSend();
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Olá ${activeConversation?.contactName ?? ""}, vim pelo Sigillus.`)}`;

  if (!isLoggedIn) {
    return (
      <AppShell>
        <div className="flex min-h-120 items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <div className="max-w-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wine-50 text-wine-700">
              <Shield size={22} />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Chat privado</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">Entre na sua conta para acessar conversas, apelidos e recursos de segurança da plataforma.</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link href="/auth/login">
                <Button>Entrar</Button>
              </Link>
              <Link href="/auth/cadastro">
                <Button variant="secondary">Criar conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const conversationOpenMobile = isMobileViewport && mobileConversationOpen && Boolean(activeConversation);

  return (
    <AppShell
      hideMobileBottomNav={conversationOpenMobile}
      hideTopHeader={conversationOpenMobile}
      mainClassName={conversationOpenMobile ? "px-0 pb-0 pt-0 sm:px-0" : undefined}
    >
      <div className="fixed right-4 top-4 z-240 w-[min(22rem,calc(100vw-2rem))] space-y-2">
        {toast ? <Toast title={toast.title} message={toast.message} type={toast.type} /> : null}
      </div>

      <div className={cn(
        "relative flex w-full min-h-0 flex-col bg-zinc-50 md:grid md:grid-cols-[340px_minmax(0,1fr)] md:overflow-hidden md:rounded-[28px] md:border md:border-zinc-200/80 md:bg-white md:shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        "min-h-[calc(100dvh-8rem-env(safe-area-inset-top,0px))] md:min-h-128 md:h-[calc(100dvh-12.5rem)]",
        conversationOpenMobile && "max-md:hidden"
      )}>
        <aside className="flex h-full min-h-0 w-full flex-col bg-zinc-50/80 md:shrink-0 md:border-r md:border-zinc-200">
          <div className="border-b border-zinc-200 bg-white/80 px-4 py-1.5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-zinc-900">Conversas</h1>
                <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-500">Você aparece como {globalAlias} para os outros</p>
              </div>
              <button
                type="button"
                onClick={openGlobalAliasModal}
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300"
                aria-label="Alterar apelido geral"
              >
                <UserRound size={18} />
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white bg-wine-700 text-white shadow-sm transition-transform group-hover:scale-110">
                  <Pencil size={10} strokeWidth={2.5} />
                </div>
              </button>
            </div>
            {role === "profissional" ? (
              <div className="mt-2.5 rounded-2xl border border-zinc-200 bg-zinc-50">
                <button
                  type="button"
                  onClick={() => {
                    setAvailabilityPanelOpen((current) => {
                      const next = !current;
                      saveAvailabilityPanelOpen(next);
                      return next;
                    });
                  }}
                  aria-expanded={availabilityPanelOpen}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="shrink-0 text-sm font-semibold text-zinc-800">Disponibilidade</p>
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", activeAvailabilityOption.dotClass)} />
                    <span className="truncate text-xs font-semibold text-zinc-600">{activeAvailabilityOption.label}</span>
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200", availabilityPanelOpen && "rotate-180")}
                  />
                </button>

                {availabilityPanelOpen ? (
                  <div className="border-t border-zinc-200 px-3 pb-3 pt-2">
                    <p className="min-h-8 text-xs leading-4 text-zinc-500">
                      {getProfessionalAvailabilityDescription(professionalAvailability)}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="Disponibilidade">
                      {professionalAvailabilityOptions.map((option) => {
                        const isActive = professionalAvailability === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setProfessionalAvailability(option.value);
                              saveProfessionalAvailability(option.value);
                            }}
                            aria-pressed={isActive}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2 text-center transition",
                              isActive
                                ? cn("border-transparent ring-1 shadow-sm", option.activeClass)
                                : "border-transparent bg-white/70 text-zinc-500 hover:bg-white hover:text-zinc-700",
                            )}
                          >
                            <span className={cn("h-2 w-2 rounded-full", option.dotClass)} />
                            <span className="text-[10px] font-bold leading-none">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-semibold text-zinc-800">Aparecer online</p>
                  <p className="min-h-4 text-xs leading-4 text-zinc-500">
                    {presenceVisible ? "Seu status aparece online." : "Seu status aparece offline."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPresenceVisible((current) => !current)}
                  className={cn(
                    "relative h-7 w-12 rounded-full transition",
                    presenceVisible ? "bg-emerald-500" : "bg-zinc-300",
                  )}
                  aria-pressed={presenceVisible}
                  aria-label="Alternar status online"
                >
                  <span
                    className={cn(
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
                      presenceVisible ? "left-6" : "left-1",
                    )}
                  />
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2 p-2.5">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3">
                  <div className="h-12 w-12 animate-pulse rounded-full bg-zinc-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
                    <div className="h-3 w-44 animate-pulse rounded bg-zinc-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <WifiOff className="mx-auto text-zinc-400" size={28} />
                <p className="mt-3 text-sm font-semibold text-zinc-800">{loadError}</p>
                <Button className="mt-4" variant="secondary" size="sm" onClick={() => void loadChat()}>
                  <RefreshCcw size={15} />
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : visibleConversations.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Nenhuma conversa na caixa</p>
                <p className="mt-1 text-xs text-zinc-500">Quando uma conversa for iniciada, ela aparecerá aqui.</p>
              </div>
            </div>
          ) : (
            <ul className="flex-1 space-y-1.5 overflow-y-auto p-2.5">
              {visibleConversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    onClick={() => openConversation(conversation.id)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200",
                      activeConversationId === conversation.id
                        ? "border-wine-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] ring-1 ring-wine-500/10"
                        : "border-transparent bg-transparent hover:border-zinc-200 hover:bg-white/80 hover:shadow-sm"
                    )}
                  >
                    <div className="relative h-12 w-12 shrink-0">
                      <Image src={conversationAvatars[conversation.id] || "/placeholder.png"} alt={conversation.contactName} fill className="rounded-full border border-zinc-100 object-cover" />
                      <span className={cn("absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white", getStatusColor(conversation.contactStatus))} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-bold text-zinc-900 group-hover:text-wine-800">{conversation.contactName}</p>
                        <span className="text-[10px] font-medium text-zinc-400">{conversation.lastMessageAt}</span>
                      </div>
                      <p className="truncate text-xs text-zinc-500">{conversation.lastMessage}</p>
                    </div>
                    {conversation.unread > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-wine-700 px-1.5 text-[10px] font-bold text-white">{conversation.unread}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="relative hidden min-h-0 flex-1 flex-col overflow-hidden bg-zinc-100/50 overscroll-none md:flex">
          {!activeConversation ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Selecione uma conversa</p>
                <p className="mt-1 text-xs text-zinc-500">As mensagens aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <ConversationThread
              activeConversation={activeConversation}
              activeConversationId={activeConversationId}
              activeAd={activeAd}
              attachmentMenuOpen={attachmentMenuOpen}
              conversationAvatar={conversationAvatars[activeConversationId] || "/placeholder.png"}
              currentMessages={currentMessages}
              displayContactName={displayContactName}
              draft={draft}
              globalAlias={globalAlias}
              lastSentMessageId={lastSentMessageId}
              participantAlias={participantAlias}
              profilePanelOpen={profilePanelOpen}
              scrollRef={scrollRef}
              showBackButton={false}
              whatsappUrl={whatsappUrl}
              onAttachmentMenuToggle={() => setAttachmentMenuOpen((current) => !current)}
              onBack={() => { setMobileConversationOpen(false); setProfilePanelOpen(false); }}
              onBlock={() => setBlockModalOpen(true)}
              onDelete={() => setDeleteModalOpen(true)}
              onDraftChange={setDraft}
              onOpenProfile={() => setProfilePanelOpen(true)}
              onOpenRename={openRenameModal}
              onOpenViewOnce={handleOpenViewOnceModal}
              onProfileClose={() => setProfilePanelOpen(false)}
              onReport={() => setReportModalOpen(true)}
              onSubmit={handleSubmit}
            />
          )}
        </section>
      </div>

      {conversationOpenMobile && activeConversation && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-100 flex flex-col bg-zinc-100 overscroll-none md:hidden">
              <ConversationThread
                activeConversation={activeConversation}
                activeConversationId={activeConversationId}
                activeAd={activeAd}
                attachmentMenuOpen={attachmentMenuOpen}
                conversationAvatar={conversationAvatars[activeConversationId] || "/placeholder.png"}
                currentMessages={currentMessages}
                displayContactName={displayContactName}
                draft={draft}
                globalAlias={globalAlias}
                lastSentMessageId={lastSentMessageId}
                participantAlias={participantAlias}
                profilePanelOpen={profilePanelOpen}
                scrollRef={scrollRef}
                showBackButton
                whatsappUrl={whatsappUrl}
                onAttachmentMenuToggle={() => setAttachmentMenuOpen((current) => !current)}
                onBack={() => { setMobileConversationOpen(false); setProfilePanelOpen(false); }}
                onBlock={() => setBlockModalOpen(true)}
                onDelete={() => setDeleteModalOpen(true)}
                onDraftChange={setDraft}
                onOpenProfile={() => setProfilePanelOpen(true)}
                onOpenRename={openRenameModal}
                onOpenViewOnce={handleOpenViewOnceModal}
                onProfileClose={() => setProfilePanelOpen(false)}
                onReport={() => setReportModalOpen(true)}
                onSubmit={handleSubmit}
              />
            </div>,
            document.body
          )
        : null}

      <Modal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Seu apelido para essa conversa"
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setRenameModalOpen(false)}>Cancelar</Button>
            <Button fullWidth onClick={saveParticipantAlias}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <label htmlFor="conversation-alias" className="text-sm font-semibold text-zinc-800">Apelido</label>
          <input
            id="conversation-alias"
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            placeholder="Ex: Cliente reservado"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
            maxLength={40}
            autoFocus
          />
          <p className="text-xs text-zinc-500">Deixe vazio para usar seu apelido geral.</p>
        </div>
      </Modal>

      <Modal
        open={globalAliasModalOpen}
        onClose={() => setGlobalAliasModalOpen(false)}
        title="Apelido geral"
        description="Esse nome será usado quando uma conversa não tiver apelido próprio."
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setGlobalAliasModalOpen(false)}>Cancelar</Button>
            <Button fullWidth onClick={saveGlobalAlias}>Salvar</Button>
          </>
        }
      >
        <div className="space-y-3">
          <label htmlFor="global-alias" className="text-sm font-semibold text-zinc-800">Apelido</label>
          <input
            id="global-alias"
            value={globalAliasDraft}
            onChange={(event) => setGlobalAliasDraft(event.target.value)}
            placeholder="Ex: Cliente reservado"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
            maxLength={40}
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        open={viewOnceModalOpen}
        onClose={() => setViewOnceModalOpen(false)}
        title="Mídia temporária"
        description="No backend real, o arquivo será enviado para storage privado e exibido uma única vez."
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setViewOnceModalOpen(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleSendViewOnceMedia}>Simular envio</Button>
          </>
        }
      >
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-wine-700">
              <ImageIcon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Visualização única</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">A mídia aparece como aberta depois da primeira visualização e não deve ficar acessível novamente para o usuário.</p>
            </div>
          </div>
        </div>
      </Modal>

      <PremiumConversionModal
        open={premiumUpsellOpen}
        onClose={() => setPremiumUpsellOpen(false)}
        highlight={premiumUpsellHighlight}
        from={premiumUpsellHighlight}
      />

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Excluir da minha caixa"
        description={`Remover a conversa com ${displayContactName} da sua lista?`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" fullWidth onClick={handleDeleteFromInbox}>Excluir da minha caixa</Button>
          </>
        }
      >
        <p className="rounded-2xl bg-zinc-50 p-3 text-sm leading-relaxed text-zinc-600">
          Essa ação remove a conversa da sua visualização no app. A política de retenção e auditoria fica a cargo do backend.
        </p>
      </Modal>

      <Modal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        title={activeConversation?.isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
        description={activeConversation?.isBlocked ? `Desbloquear ${displayContactName}?` : `Bloquear ${displayContactName}?`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setBlockModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" fullWidth onClick={activeConversation?.isBlocked ? handleUnblockUser : handleBlockUser}>
              {activeConversation?.isBlocked ? "Desbloquear" : "Bloquear"}
            </Button>
          </>
        }
      >
        <p className="rounded-2xl bg-wine-50 p-3 text-sm leading-relaxed text-wine-800">
          {activeConversation?.isBlocked ? "O envio de mensagens será reativado nesta conversa." : "O envio de novas mensagens será desativado nesta conversa."}
        </p>
      </Modal>

      <Modal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Denunciar conversa"
        description={`Descreva o problema com ${displayContactName}.`}
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={() => setReportModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" fullWidth onClick={handleReportConversation} disabled={!reportReason.trim()}>Enviar denúncia</Button>
          </>
        }
      >
        <textarea
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          placeholder="Conte o que aconteceu..."
          className="min-h-32 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 outline-none transition focus:border-wine-500 focus:bg-white"
          maxLength={600}
        />
      </Modal>
    </AppShell>
  );
}

function ConversationThread({
  activeConversation,
  activeAd,
  attachmentMenuOpen,
  conversationAvatar,
  currentMessages,
  displayContactName,
  draft,
  globalAlias,
  lastSentMessageId,
  participantAlias,
  profilePanelOpen,
  scrollRef,
  showBackButton,
  whatsappUrl,
  onAttachmentMenuToggle,
  onBack,
  onBlock,
  onDelete,
  onDraftChange,
  onOpenProfile,
  onOpenRename,
  onOpenViewOnce,
  onProfileClose,
  onReport,
  onSubmit,
}: {
  activeConversation: Conversation;
  activeConversationId: string;
  activeAd: ProfessionalAd | null;
  attachmentMenuOpen: boolean;
  conversationAvatar: string;
  currentMessages: Message[];
  displayContactName: string;
  draft: string;
  globalAlias: string;
  lastSentMessageId: string | null;
  participantAlias: string;
  profilePanelOpen: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
  showBackButton: boolean;
  whatsappUrl: string;
  onAttachmentMenuToggle: () => void;
  onBack: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onDraftChange: (value: string) => void;
  onOpenProfile: () => void;
  onOpenRename: () => void;
  onOpenViewOnce: () => void;
  onProfileClose: () => void;
  onReport: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <header className="relative z-30 flex shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white/95 px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-3 backdrop-blur-sm md:px-5 md:pt-4">
        {showBackButton ? (
          <button
            type="button"
            onClick={onBack}
            className={cn(chromeCircle, "text-zinc-600")}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        ) : null}

        <button type="button" className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left" onClick={onOpenProfile}>
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.08)]">
            <Image src={conversationAvatar} alt="Avatar" fill className="rounded-full object-cover" />
            <span className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white", getStatusColor(activeConversation.contactStatus))} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold leading-none text-zinc-900">{displayContactName}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">{getStatusLabel(activeConversation.contactStatus)}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className={cn(chromeCircle, "text-zinc-500")}
          aria-label="Abrir opções do contato"
        >
          <MoreHorizontal size={18} />
        </button>
      </header>

      {activeConversation.isBlocked ? (
        <div className="shrink-0 border-b border-wine-100 bg-wine-50 px-4 py-3 text-sm font-medium text-wine-800">
          Usuário bloqueado. O envio de novas mensagens está desativado nesta conversa.
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          className={cn(
            "absolute inset-0 z-20 bg-zinc-900/30 px-3 transition-opacity duration-200 md:px-5",
            profilePanelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={onProfileClose}
        >
          <div
            className={cn(
              "mt-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl transition-all duration-250 ease-out md:ml-auto md:mr-4 md:mt-6 md:w-90",
              profilePanelOpen ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.98] opacity-0"
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="px-2 pb-2">
              <p className="truncate text-sm font-bold text-zinc-900">{displayContactName}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-zinc-400">Ações da conversa</p>
            </div>

            <div className="space-y-1">
              <button type="button" onClick={onOpenRename} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
                <UserRound size={16} />
                Alterar apelido para essa conversa
              </button>

              {activeAd ? (
                <Link href={`/anuncio/${activeAd.slug}`} onClick={onProfileClose} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
                  Ver anúncio público
                </Link>
              ) : (
                <button type="button" disabled className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-400">
                  Ver anúncio público
                </button>
              )}

              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
                Ir para WhatsApp
              </a>

              <button type="button" onClick={onBlock} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                <Ban size={16} />
                {activeConversation.isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}
              </button>

              <button type="button" onClick={onReport} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50">
                <Flag size={16} />
                Denunciar conversa
              </button>

              <button type="button" onClick={onDelete} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-wine-700 transition hover:bg-wine-50">
                <Trash2 size={16} />
                Excluir da minha caixa
              </button>
            </div>

            <div className="mt-2 border-t border-zinc-100 px-2 pt-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Seu apelido para esse contato</p>
              <p className="mt-1 text-sm font-semibold text-zinc-700">{participantAlias || globalAlias}</p>
            </div>
          </div>
        </div>

        <div className="h-full space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.8),rgba(248,250,252,0.92)_38%,rgba(244,244,245,1)_100%)] p-4 md:p-6">
          {currentMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Nenhuma mensagem ainda</p>
                <p className="mt-1 text-xs text-zinc-500">Envie a primeira mensagem para iniciar a conversa.</p>
              </div>
            </div>
          ) : currentMessages.map((message) => {
            const status = getMessageStatus(message);
            const StatusIcon = status?.icon;

            return (
              <div key={message.id} className={cn(
                "flex max-w-[85%] flex-col md:max-w-[68%]",
                message.from === "me" ? "ml-auto items-end" : "mr-auto items-start",
                message.from === "me" && message.id === lastSentMessageId ? "message-sent-pop" : ""
              )}>
                <div className={cn(
                  "px-4 py-2.5 text-sm shadow-sm",
                  message.from === "me" ? "rounded-2xl rounded-tr-sm bg-wine-700 text-white shadow-[0_10px_22px_rgba(182,0,49,0.18)]" : "rounded-2xl rounded-tl-sm border border-zinc-200/60 bg-white text-zinc-800"
                )}>
                  {message.messageType === "media" ? (
                    <div className="flex items-center gap-3">
                      <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", message.from === "me" ? "bg-white/15" : "bg-zinc-100")}>
                        <ImageIcon size={18} />
                      </span>
                      <div>
                        <p className="font-semibold">{message.media?.name ?? "Mídia"}</p>
                        <p className={cn("text-xs", message.from === "me" ? "text-white/75" : "text-zinc-500")}>
                          {message.media?.openedAt ? "Aberta" : "Visualização única"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="leading-relaxed">{message.content}</p>
                  )}
                </div>
                <span className="mt-1 flex items-center gap-1 px-1 text-[10px] font-medium uppercase text-zinc-400">
                  {message.sentAt}
                  {StatusIcon ? (
                    <>
                      <StatusIcon size={12} className={status.className} />
                      <span className={cn("normal-case", status.className)}>{status.label}</span>
                    </>
                  ) : null}
                </span>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </div>

      <form className="shrink-0 border-t border-zinc-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]" onSubmit={onSubmit}>
        <div className="relative mx-auto flex max-w-5xl items-center gap-3">
          <button
            type="button"
            onClick={onAttachmentMenuToggle}
            disabled={activeConversation.isBlocked}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Abrir anexos"
          >
            <Plus size={20} />
          </button>

          {attachmentMenuOpen ? (
            <div className="absolute bottom-14 left-0 z-30 w-64 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
              <button type="button" onClick={onOpenViewOnce} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
                <ImageIcon size={17} />
                Enviar mídia temporária
              </button>
            </div>
          ) : null}

          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder={activeConversation.isBlocked ? "Usuário bloqueado" : "Mensagem..."}
            disabled={activeConversation.isBlocked}
            className="h-11 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-sm shadow-sm transition-all focus:border-wine-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button type="submit" className="h-11 rounded-full px-4 font-bold sm:px-6 gap-2" disabled={!draft.trim() || activeConversation.isBlocked}>
            <Send size={17} />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        </div>
      </form>
    </>
  );
}
