"use client";

import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProfessionalAd } from "@/lib/types";

interface StandardHeroSectionProps {
  ad: ProfessionalAd;
}

export function StandardHeroSection({ ad }: StandardHeroSectionProps) {
  return (
    <section className="relative h-64 w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-md sm:h-80 md:h-96">
      <Image src={ad.images[0]} alt="Foto de capa standard" fill className="object-cover" priority sizes="100vw" referrerPolicy="no-referrer" />
      <div className="absolute inset-0 z-10 bg-linear-to-t from-zinc-950/95 via-zinc-950/45 to-black/30" />

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="relative shrink-0">
            <div className="relative h-18 w-18 overflow-hidden rounded-full border-4 border-white/95 bg-zinc-900 shadow-lg sm:h-24 sm:w-24 md:h-32 md:w-32">
              <Image
                src={ad.images[1] || ad.images[0]}
                alt={ad.artisticName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 72px, (max-width: 768px) 96px, 128px"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute right-[14.6%] bottom-[14.6%] z-20 translate-x-1/2 translate-y-1/2">
              <span className="relative flex h-3 w-3 items-center justify-center sm:h-4 sm:w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-65"></span>
                <span className="relative inline-flex h-full w-full rounded-full bg-[#10b981] ring-2 ring-white"></span>
              </span>
            </div>
          </div>

          <div className="space-y-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-2xl md:text-3xl">{ad.artisticName}</h1>
              <span className="text-base font-semibold text-zinc-100 sm:text-lg md:text-xl">{ad.age} anos</span>
              <span className="origin-left scale-90">
                <StatusBadge status={ad.status} />
              </span>
            </div>
            <p className="font-sans text-xs font-medium text-zinc-100 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] sm:text-sm md:text-base">
              {ad.displayName} • {ad.neighborhood}, {ad.city}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
