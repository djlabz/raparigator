"use client";

import { Ruler, Scale, Eye, User, Cigarette, Sparkles } from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";

interface StandardCharacteristicsProps {
  ad: ProfessionalAd;
}

export function StandardCharacteristics({ ad }: StandardCharacteristicsProps) {
  const attributes = [
    {
      label: "Altura",
      value: `${ad.heightCm} cm`,
      icon: Ruler,
    },
    {
      label: "Cabelo",
      value: `${ad.hairType} • ${ad.hairColor}`,
      icon: Sparkles,
    },
    {
      label: "Etnia",
      value: ad.ethnicity,
      icon: User,
    },
    {
      label: "Olhos",
      value: ad.eyeColor,
      icon: Eye,
    },
    {
      label: "Fumante?",
      value: "Não", // Mocked value, consistent with premium
      icon: Cigarette,
    },
    {
      label: "Peso",
      value: `${ad.weightKg} kg`,
      icon: Scale,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {attributes.map((attr) => {
        const Icon = attr.icon;
        return (
          <div
            key={attr.label}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-colors hover:border-zinc-300"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wine-50 text-wine-700">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                {attr.label}
              </p>
              <p className="truncate text-sm font-bold text-zinc-800">
                {attr.value}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
