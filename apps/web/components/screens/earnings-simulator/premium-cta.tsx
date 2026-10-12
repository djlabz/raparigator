"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { PremiumConversionModal } from "@/components/ui/premium-conversion-modal";
import { ShinyButton } from "@/components/ui/shiny-button";
import { usePremiumPlan } from "@/lib/premium-plan";

export function PremiumCta() {
  const { isPremium } = usePremiumPlan();
  const [open, setOpen] = useState(false);

  return (
    <>
      {!isPremium ? (
        <Card className="space-y-3 p-4 md:p-5">
          <p className="text-sm text-zinc-700">
            Quer mais destaque para o seu anúncio nas pesquisas?
          </p>
          <ShinyButton size="sm" className="w-full min-w-0" onClick={() => setOpen(true)}>
            Experimentar o Premium
          </ShinyButton>
        </Card>
      ) : null}
      <PremiumConversionModal
        open={open}
        onClose={() => setOpen(false)}
        highlight="topSearch"
        from="topSearch"
      />
    </>
  );
}
