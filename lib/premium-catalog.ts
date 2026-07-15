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
}

export const PREMIUM_PLAN_OPTIONS: PremiumPlanOption[] = [
  {
    cycle: "monthly",
    label: "Mensal",
    price: 89.9,
    monthlyEquivalent: 89.9,
  },
  {
    cycle: "yearly",
    label: "Anual",
    price: 718.8,
    monthlyEquivalent: 59.9,
    badge: "Mais vantajoso",
  },
];

export function getPlanOption(cycle: PremiumBillingCycle): PremiumPlanOption {
  return PREMIUM_PLAN_OPTIONS.find((option) => option.cycle === cycle) ?? PREMIUM_PLAN_OPTIONS[0];
}

export function getImmediateGains(): PremiumImmediateGain[] {
  return [
    {
      id: "photos",
      label: "Fotos no portfólio",
      from: "6",
      to: "15",
    },
    {
      id: "videos",
      label: "Vídeos no portfólio",
      from: "1",
      to: "5",
    },
    {
      id: "view-once",
      label: "Mídias de visualização única",
      from: "5/mês",
      to: "Ilimitado",
    },
    {
      id: "visibility",
      label: "Visibilidade nas buscas",
      from: "Padrão",
      to: "Topo + selo Premium",
    },
  ];
}
