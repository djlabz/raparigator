"use client";

import { useEffect, useState } from "react";
import type { PremiumPlanOption } from "@sigillus/contracts";
import { PREMIUM_PLAN_OPTIONS, getBillingSavingsPercent, getPlanOption } from "@sigillus/domain";
import { getApiClient } from "@/lib/api/client";
import { reportStoreError } from "@/lib/report-store-error";

export type { PremiumPlanOption };
export { getBillingSavingsPercent, getPlanOption };

export type PremiumPlansResult = { plans: PremiumPlanOption[]; stale: boolean };

const LOCAL_PLANS: PremiumPlansResult = { plans: PREMIUM_PLAN_OPTIONS, stale: false };

let cachedApiPlans: PremiumPlansResult | null = null;
let apiPlansPromise: Promise<PremiumPlansResult> | null = null;

async function fetchPremiumPlans(): Promise<PremiumPlansResult> {
  if (cachedApiPlans && !cachedApiPlans.stale) {
    return cachedApiPlans;
  }
  if (apiPlansPromise) {
    return apiPlansPromise;
  }
  apiPlansPromise = (async () => {
    try {
      const plans = await getApiClient().premium.plans();
      cachedApiPlans = { plans, stale: false };
    } catch (error) {
      reportStoreError("premium.plans", error);
      cachedApiPlans = { plans: PREMIUM_PLAN_OPTIONS, stale: true };
    } finally {
      apiPlansPromise = null;
    }
    return cachedApiPlans;
  })();
  return apiPlansPromise;
}

function getCachedPremiumPlans(): PremiumPlansResult {
  return cachedApiPlans ?? LOCAL_PLANS;
}

export function usePremiumPlans(): PremiumPlansResult {
  const [result, setResult] = useState<PremiumPlansResult>(getCachedPremiumPlans);

  useEffect(() => {
    let active = true;
    void fetchPremiumPlans().then((fetched) => {
      if (active) {
        setResult(fetched);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return result;
}

export interface PremiumImmediateGain {
  id: string;
  label: string;
  from: string;
  to: string;
  exclusive?: boolean;
}

export const PREMIUM_EXCLUSIVE_FEATURES = [
  "Visualização única",
  "Apelido por cliente/conversa",
  "Acesso prioritário a novos recursos e benefícios",
] as const;

export function getSharedGains(): PremiumImmediateGain[] {
  return [
    {
      id: "visibility",
      label: "Perfil em destaque",
      from: "Listagem padrão",
      to: "Mais views e conversões + selo e card Premium",
    },
    {
      id: "portfolio",
      label: "Mídia no portfólio",
      from: "10 fotos e 3 vídeos",
      to: "Ilimitado",
    },
  ];
}

export function getImmediateGains(): PremiumImmediateGain[] {
  return [
    ...getSharedGains(),
    {
      id: "view-once",
      label: "Visualização única",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
    {
      id: "alias",
      label: "Apelido por cliente/conversa",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
    {
      id: "early-access",
      label: "Acesso prioritário a novos recursos e benefícios",
      from: "Não incluso",
      to: "Exclusivo Premium",
      exclusive: true,
    },
  ];
}
