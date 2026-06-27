"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShieldCheck, MapPin } from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";

interface StandardProfileHeaderProps {
  ad: ProfessionalAd;
}

export function StandardProfileHeader({ ad }: StandardProfileHeaderProps) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6 md:items-start">
        <div className="relative shrink-0">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 sm:h-28 sm:w-28 md:h-32 md:w-32">
            <Image
              src={ad.images[1] || ad.images[0]}
              alt={ad.artisticName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-1 right-1 z-20">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-65"></span>
              <span className="relative inline-flex h-full w-full rounded-full bg-[#10b981] ring-2 ring-white"></span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="font-display text-2xl font-bold text-zinc-900 md:text-3xl">{ad.artisticName}</h1>
            <span className="text-lg font-semibold text-zinc-600 md:text-xl">{ad.age} anos</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500 sm:justify-start">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-wine-700" />
              {ad.neighborhood}, {ad.city}
            </span>
            <span className="hidden sm:block">•</span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
              Identidade Verificada
            </span>
          </div>

          <div className="mt-2 scale-90 sm:origin-left sm:scale-100">
            <StatusBadge status={ad.status} />
          </div>
        </div>
      </div>
    </section>
  );
}
