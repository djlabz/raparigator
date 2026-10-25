"use client";

import { Crown } from "lucide-react";
import { usePremiumPlan } from "@/lib/premium-plan";
import { cn } from "@/lib/utils";

interface PremiumEntryBannerProps {
  variant: "sidebar" | "availability";
  onClick: () => void;
  className?: string;
}

export function PremiumEntryBanner({ variant, onClick, className }: PremiumEntryBannerProps) {
  const { checkoutEnabled } = usePremiumPlan();

  if (!checkoutEnabled) {
    return null;
  }

  const isSidebar = variant === "sidebar";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-gold/40 bg-premium-surface p-5 text-left transition hover:border-gold-bright/60",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold-bright/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-bright">
        <Crown className="h-3 w-3" aria-hidden="true" />
        Sigillus Premium
      </span>
      <p className="mt-3 font-display text-lg font-semibold text-gold-bright">
        {isSidebar ? "Seu anúncio pode ir mais longe" : "Onde o destaque é privilégio."}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-400">
        {isSidebar
          ? "Perfil em destaque, portfólio maior e tráfego VIP revelado."
          : "Suba no ranking, ganhe selo Premium e desbloqueie recursos exclusivos no chat."}
      </p>
      {!isSidebar ? (
        <ul className="mt-3 space-y-1 text-sm leading-snug text-zinc-300">
          <li>Da listagem comum → perfil em destaque</li>
          <li>De 10 fotos e 3 vídeos → mídia ilimitada</li>
          <li>Mídias de visualização única no chat</li>
        </ul>
      ) : null}
      <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-widest text-gold">
        {isSidebar ? "Ver o que muda →" : "Ver benefícios →"}
      </span>
    </button>
  );
}
