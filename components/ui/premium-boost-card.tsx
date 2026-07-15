"use client";

import { useState } from "react";
import { Crown, MoveRight, TrendingUp } from "lucide-react";
import { PremiumUpsellModal, type PremiumHighlight } from "@/components/ui/premium-upsell-modal";
import { ShinyButton } from "@/components/ui/shiny-button";
import { trafficDiscovery } from "@/lib/mock-data";
import { usePremiumPlan } from "@/lib/premium-plan";

interface PremiumBoostCardProps {
  highlight?: PremiumHighlight;
}

export function PremiumBoostCard({ highlight = "topSearch" }: PremiumBoostCardProps) {
  const { isPremium } = usePremiumPlan();
  const [upsellOpen, setUpsellOpen] = useState(false);

  if (isPremium) {
    return null;
  }

  return (
    <div className="premium-panel-shell premium-sheen relative overflow-hidden rounded-xl p-5 sm:p-6">
      <div className="relative z-10 space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DAA520]/35 bg-[#FFDF00]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FFDF00]">
          <Crown className="h-3 w-3" aria-hidden="true" />
          Sigillus Premium
        </span>

        <div className="space-y-1">
          <h3 className="font-display text-xl font-semibold text-white">Turbine seu anúncio</h3>
          <p className="text-sm leading-relaxed text-zinc-400">
            Seu anúncio compete com dezenas na sua cidade. O Premium coloca você na frente de todos.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#DAA520]/30 bg-black/35 px-4 py-3">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Hoje</p>
            <p className="font-display text-2xl font-semibold text-zinc-400">
              {trafficDiscovery.searchPosition}º
            </p>
          </div>
          <MoveRight className="h-5 w-5 shrink-0 text-[#DAA520]" aria-hidden="true" />
          <div className="text-center">
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#DAA520]">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              Premium
            </p>
            <p className="font-display text-2xl font-semibold text-[#FFDF00] premium-glow-pulse rounded-lg px-2">
              {trafficDiscovery.premiumSearchPosition}º
            </p>
          </div>
          <p className="max-w-36 text-xs leading-snug text-zinc-400">na busca da sua cidade, todos os dias</p>
        </div>

        <ShinyButton fullWidth size="sm" onClick={() => setUpsellOpen(true)}>
          Ver tudo que o Premium libera
        </ShinyButton>
      </div>

      <PremiumUpsellModal open={upsellOpen} onClose={() => setUpsellOpen(false)} highlight={highlight} />
    </div>
  );
}
