"use client";

import Link from "next/link";
import { Crown, Lock, MessageSquare, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TelegramIcon, WhatsAppIcon } from "@/components/ui/contact-icons";
import type { EncounterBrief } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useContactCta } from "./use-contact-cta";
import type { AdDetailsVariant } from "./variant";

interface SidebarCtaProps {
  role: string;
  variant: AdDetailsVariant;
  setRiskTarget: (target: "WhatsApp" | "Telegram") => void;
  brief: EncounterBrief | null;
}

function ContactButtons({ role, variant, setRiskTarget, brief }: SidebarCtaProps) {
  const { onLoginClick, openChatWithBrief } = useContactCta(brief);
  const isPremium = variant === "premium";

  const primaryClassName = isPremium
    ? "group relative block w-full outline-[none]"
    : cn(
        "group/btn relative flex h-14 w-full items-center justify-center gap-2 rounded-xl font-bold shadow-sm transition-all",
        role === "visitor"
          ? "bg-zinc-900 text-white! hover:bg-zinc-800"
          : "bg-wine-700 text-white hover:bg-wine-800",
      );
  const premiumInnerClassName =
    "relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-premium-surface px-5 py-2 font-bold text-amber-400 shadow-sm transition-all duration-300 hover:bg-[#1a1a1a]";
  const externalClassName = isPremium
    ? "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-premium-surface px-2 text-sm font-bold shadow-sm transition-all duration-300 hover:scale-[1.02] hover:bg-[#18181b] focus-visible:outline-none active:scale-[0.98]"
    : "flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-bold transition-all hover:bg-zinc-50";

  const primaryContent =
    role === "visitor" ? (
      <>
        {isPremium ? <MessageSquare className="h-5 w-5" /> : <Lock className="h-4 w-4" />} Entrar
        para Interagir
      </>
    ) : (
      <>
        <MessageSquare className={isPremium ? "h-5 w-5" : "h-4 w-4"} />{" "}
        {isPremium ? "Iniciar Chat" : "Iniciar Chat Direto"}
      </>
    );

  const wrapPremium = (content: React.ReactNode) =>
    isPremium ? (
      <>
        <div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-amber-500/30 to-amber-600/30 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
        <span className={premiumInnerClassName}>{content}</span>
      </>
    ) : (
      content
    );

  return (
    <div
      className={cn("flex w-full flex-col", isPremium ? "relative z-10 mt-2 space-y-3" : "gap-3")}
    >
      {role === "visitor" ? (
        <Link href="/auth/login" onClick={onLoginClick} className={primaryClassName}>
          {wrapPremium(primaryContent)}
        </Link>
      ) : (
        <button type="button" onClick={openChatWithBrief} className={primaryClassName}>
          {wrapPremium(primaryContent)}
        </button>
      )}

      <div className={cn("flex w-full items-center", isPremium ? "gap-3" : "gap-2")}>
        <button
          type="button"
          onClick={() => setRiskTarget("WhatsApp")}
          className={cn(externalClassName, "text-whatsapp")}
        >
          <WhatsAppIcon className={isPremium ? "h-4.5 w-4.5" : "h-5 w-5"} /> WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setRiskTarget("Telegram")}
          className={cn(externalClassName, "text-telegram")}
        >
          <TelegramIcon className={isPremium ? "h-4.5 w-4.5" : "h-5 w-5"} /> Telegram
        </button>
      </div>
    </div>
  );
}

export function SidebarCta(props: SidebarCtaProps) {
  if (props.variant === "standard") {
    return (
      <div className="sticky top-20 flex w-full flex-col gap-4">
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-wine-100 bg-red-50 text-wine-700">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-display text-sm font-extrabold tracking-widest text-wine-700 uppercase">
              Contato Exclusivo
            </h3>
            <h4 className="mb-2 font-display text-2xl font-bold text-zinc-900">Fale Agora</h4>
            <p className="mb-6 text-sm leading-relaxed text-zinc-500">
              Entre em contato direto e seguro. Tudo é acordado diretamente com a profissional.
            </p>

            <ContactButtons {...props} />

            <div className="mt-6 flex flex-col items-center justify-center gap-2 border-t border-zinc-100 pt-5 text-xs text-zinc-500">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="max-w-50">Chat com apelido, bloqueio e denúncia dentro da Sigillus.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative space-y-6 overflow-hidden rounded-2xl border-0 bg-linear-to-br from-premium-surface via-[#1a1a1a] to-[#0a0a0a] p-5 text-center shadow-xl sm:p-6">
      <div className="pointer-events-none absolute top-0 right-0 rotate-12 p-8 opacity-10">
        <Sparkles className="h-32 w-32 text-amber-300" strokeWidth={2.5} />
      </div>
      <div className="absolute -bottom-10 -left-10 h-32 w-32 overflow-hidden rounded-full bg-linear-to-tr from-amber-500/20 to-transparent blur-2xl" />

      <div className="relative z-10 flex flex-col items-center space-y-4">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-amber-900/40 bg-black/50 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <Crown className="h-6 w-6 text-amber-400" />
        </div>

        <div className="space-y-1">
          <h3 className="font-display text-xs font-extrabold tracking-[0.2em] text-amber-400 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Alto Padrão • Discrição
          </h3>
          <h4 className="bg-linear-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text pb-1 font-display text-2xl font-bold text-transparent">
            Acesso Exclusivo
          </h4>
        </div>

        <p className="max-w-62.5 text-sm leading-relaxed font-medium text-zinc-400">
          Fale diretamente com a profissional pelo chat da plataforma, com total privacidade.
        </p>

        <div className="flex w-full items-center justify-center gap-4 border-y border-white/5 py-2">
          <div className="flex flex-col items-center">
            <Lock className="mb-1 h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">Sigilo</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <Star className="mb-1 h-4 w-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
              Prestígio
            </span>
          </div>
        </div>
      </div>

      <ContactButtons {...props} />

      <div className="relative z-10 mt-2 flex w-full items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs leading-relaxed text-zinc-400 shadow-inner backdrop-blur-sm">
        <Crown className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <span>
          O contato é mantido em extrema privacidade. Detalhes e disponibilidade são acordados
          diretamente com a profissional.
        </span>
      </div>
    </Card>
  );
}
