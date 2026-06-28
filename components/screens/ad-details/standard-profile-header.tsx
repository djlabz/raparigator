"use client";

import Image from "next/image";
import { ShieldCheck, MapPin } from "lucide-react";
import type { ProfessionalAd } from "@/lib/types";

interface StandardProfileHeaderProps {
  ad: ProfessionalAd;
}

export function StandardProfileHeader({ ad }: StandardProfileHeaderProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {/* Cover Photo */}
      <div className="relative h-32 w-full bg-zinc-100 sm:h-40 md:h-48">
        <Image
          src={ad.images[0]}
          alt={`Capa de ${ad.artisticName}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/10" />
      </div>

      <div className="relative px-6 pb-6 sm:px-8">
        {/* Profile Picture */}
        <div className="relative -mt-12 mb-4 flex justify-center sm:-mt-16 sm:mb-5 sm:justify-start md:-mt-20 md:mb-6">
          <div className="relative shrink-0">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-zinc-100 shadow-md sm:h-28 sm:w-28 md:h-32 md:w-32">
              <Image
                src={ad.images[1] || ad.images[0]}
                alt={ad.artisticName}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-1 right-1 z-10 sm:bottom-2 sm:right-2">
              <span className="relative flex h-4 w-4 items-center justify-center sm:h-5 sm:w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-65"></span>
                <span className="relative inline-flex h-full w-full rounded-full bg-[#10b981] ring-2 ring-white"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-bold text-zinc-900 md:text-3xl">{ad.artisticName}</h1>
              <span className="text-lg font-semibold text-zinc-600 md:text-xl">{ad.age} anos</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500 sm:justify-start">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-wine-700" />
                {ad.neighborhood}, {ad.city}
              </span>
              <span className="hidden sm:block text-zinc-300">•</span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
                Identidade Verificada
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
