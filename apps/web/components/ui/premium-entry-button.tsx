"use client";

import { Crown } from "lucide-react";
import { usePremiumPlan } from "@/lib/premium-plan";
import { cn } from "@/lib/utils";

interface PremiumEntryButtonProps {
  onClick: () => void;
  className?: string;
}

export function PremiumEntryButton({ onClick, className }: PremiumEntryButtonProps) {
  const { checkoutEnabled } = usePremiumPlan();

  if (!checkoutEnabled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-premium-surface px-4 py-4 text-sm font-bold text-gold-bright transition hover:border-gold-bright/60",
        className,
      )}
    >
      <Crown className="h-4 w-4" aria-hidden="true" />
      Desbloquear Premium
    </button>
  );
}
