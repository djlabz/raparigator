import type { PremiumBillingCycle } from "@/lib/types";

export interface PremiumPlanOption {
  cycle: PremiumBillingCycle;
  label: string;
  price: number;
  monthlyEquivalent: number;
  badge?: string;
}

export interface PremiumImmediateGain {
  id: string;
  label: string;
  from: string;
  to: string;
  exclusive?: boolean;
}

export const PREMIUM_PLAN_OPTIONS: PremiumPlanOption[] = [
  {
    cycle: "monthly",
    label: "Mensal",
    price: 10,
    monthlyEquivalent: 10,
  },
  {
    cycle: "semiannual",
    label: "Semestral",
    price: 30,
    monthlyEquivalent: 5,
    badge: "50% off",
  },
];

export const PREMIUM_EXCLUSIVE_FEATURES = [
  "Visualização única",
  "Apelido por cliente/conversa",
  "Acesso prioritário a novos recursos e benefícios",
] as const;

export function getPlanOption(cycle: PremiumBillingCycle): PremiumPlanOption {
  return PREMIUM_PLAN_OPTIONS.find((option) => option.cycle === cycle) ?? PREMIUM_PLAN_OPTIONS[0];
}

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

export function getBillingSavingsPercent(): number {
  const monthly = getPlanOption("monthly").monthlyEquivalent;
  const semiannual = getPlanOption("semiannual").monthlyEquivalent;
  if (monthly <= 0) {
    return 0;
  }
  return Math.round(((monthly - semiannual) / monthly) * 100);
}
