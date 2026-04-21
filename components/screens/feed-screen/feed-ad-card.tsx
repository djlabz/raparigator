"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProfessionalAd } from "@/lib/types";
import { cn, currency } from "@/lib/utils";
import { FEED_CARD_SIZE_CLASS } from "./constants";

export function FeedAdCard({ ad }: { ad: ProfessionalAd }) {
  const [imageIndex, setImageIndex] = useState(0);
  const isPremium = ad.adTier === "premium";

  const cardRef = useRef<HTMLDivElement>(null);

  const handlePremiumMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = (x / rect.width - 0.5) * 2;
    const centerY = (y / rect.height - 0.5) * 2;
    const maxTilt = 15;

    cardRef.current.style.setProperty("--rot-x", `${-centerY * maxTilt}deg`);
    cardRef.current.style.setProperty("--rot-y", `${centerX * maxTilt}deg`);
    cardRef.current.style.setProperty("--glare-x", `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty("--glare-y", `${(y / rect.height) * 100}%`);
  };

  const handlePremiumMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--rot-x", "0deg");
    cardRef.current.style.setProperty("--rot-y", "0deg");
    cardRef.current.style.setProperty("--glare-x", "50%");
    cardRef.current.style.setProperty("--glare-y", "50%");
  };

  useEffect(() => {
    if (!isPremium || ad.images.length < 2) return;

    const interval = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % ad.images.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [isPremium, ad.images.length]);

  const currentImage = ad.images[imageIndex] ?? ad.images[0];

  if (isPremium) {
    const premiumImage = ad.images[0] ?? currentImage;

    return (
      <Link href={`/anuncio/${ad.slug}`} className="group mx-auto block w-full max-w-[320px] perspective-1000 lg:max-w-none">
        <article
          ref={cardRef}
          className={cn("preserve-3d relative cursor-pointer transition-transform duration-200 ease-out active:scale-[0.97]", FEED_CARD_SIZE_CLASS)
          }
          style={{
            transform: "rotateX(var(--rot-x, 0deg)) rotateY(var(--rot-y, 0deg))",
          }}
          onMouseMove={handlePremiumMouseMove}
          onMouseLeave={handlePremiumMouseLeave}
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 bg-[#120d03]" />
            <div
              className="pointer-events-none absolute inset-[-150%] animate-spin bg-[conic-gradient(from_90deg,transparent_0%,transparent_75%,rgba(255,215,0,0.1)_80%,#FFD700_95%,#ffffff_98%,transparent_100%)]"
              style={{ animationDuration: "6.5s", animationTimingFunction: "linear" }}
            />

            <div className="absolute inset-[2.5px] z-10 overflow-hidden rounded-2xl border border-[#a88222]/30 bg-[#121212] shadow-sm transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgba(218,165,32,0.22)]">
              <Image
                src={premiumImage}
                alt={`${ad.artisticName} premium`}
                fill
                className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/20 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.06)_0%,transparent_40%,rgba(218,165,32,0.1)_100%)]" />

              <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-[#DAA520]/70 bg-linear-to-br from-[#2a2a2a] to-[#0a0a0a] px-3 py-1.5 shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md">
                <span className="text-[10px] text-[#FFDF00] drop-shadow-[0_0_4px_rgba(255,223,0,0.9)]">★</span>
                <span className="bg-linear-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] bg-clip-text text-[10px] font-extrabold uppercase tracking-[0.2em] text-transparent drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                  Premium
                </span>
              </div>

              <div className="absolute right-4 top-4 z-20 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-[#FFDF00] shadow-sm ring-1 ring-[#DAA520]/60 backdrop-blur-sm">
                ★ {ad.rating.toFixed(1)}
              </div>

              <div className="absolute bottom-0 left-0 w-full px-5 pb-5">
                <div className="mb-1 flex items-center gap-2">
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", ad.status === "livre" ? "border border-emerald-800/50 bg-emerald-950/80 text-emerald-400" : ad.status === "em_atendimento" ? "border border-amber-800/50 bg-amber-950/80 text-amber-400" : "border border-zinc-700/50 bg-zinc-900/80 text-zinc-400")}>{ad.status === "livre" ? "Livre" : ad.status === "em_atendimento" ? "Em atendimento" : "Indisponivel"}</span>
                </div>
                <h3 className="font-display text-2xl font-semibold leading-tight text-[#FFDF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{ad.artisticName}</h3>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-widest text-zinc-300 drop-shadow-md">
                  A partir de <span className="text-sm font-bold tracking-normal text-[#FFDF00]">{currency(ad.startingPrice)}</span>
                </p>
              </div>

              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "radial-gradient(circle at var(--glare-x, 50%) var(--glare-y, 50%), rgba(255,223,0,0.18) 0%, transparent 55%)",
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          </div>
        </article>
      </Link>
    );
  }

  const statusLabel = ad.status === "livre" ? "LIVRE" : ad.status === "em_atendimento" ? "EM ATENDIMENTO" : "INDISPONIVEL";
  const statusClassName =
    ad.status === "livre"
      ? "border-emerald-800/30 bg-emerald-900/30 text-emerald-400"
      : ad.status === "em_atendimento"
        ? "border-amber-800/30 bg-amber-900/30 text-amber-500"
        : "border-zinc-700/50 bg-zinc-900/80 text-zinc-400";

  return (
    <Link href={`/anuncio/${ad.slug}`} className="group mx-auto block w-full max-w-[320px] cursor-pointer lg:max-w-none">
      <article className={cn("isolate relative flex flex-col overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#4a4a4a] hover:shadow-xl active:scale-[0.98]", FEED_CARD_SIZE_CLASS)}>
        <div className="relative flex-1">
          <div className="absolute inset-0">
            <Image
              src={currentImage}
              alt={`${ad.artisticName} em ${ad.city}`}
              fill
              className="object-cover object-center opacity-90 transition-transform duration-700 transform-[translateZ(0)] group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 320px"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#121212]/90 via-[#121212]/30 to-transparent" />
          </div>

          <div className="absolute right-3 top-3 z-20 flex items-start justify-end">
            <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-zinc-900 shadow-sm">
              <span className="text-[11px]">★</span>
              <span className="text-[11px] font-bold">{ad.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-4">
            <div className="mb-2">
              <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest", statusClassName)}>{statusLabel}</span>
            </div>

            <h3 className="text-2xl font-semibold tracking-tight text-zinc-100 [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]">{ad.artisticName}</h3>
            <p className="mt-1 text-xs text-zinc-300 [text-shadow:0_2px_4px_rgba(0,0,0,0.85)]">
              {ad.neighborhood}, {ad.city}
            </p>
          </div>
        </div>

        <div className="relative z-10 shrink-0 border-t border-white/20 bg-[#121212] px-5 py-4">
          <span className="mb-0.5 block text-[10px] font-bold tracking-widest text-zinc-500 uppercase">A partir de</span>
          <span className="text-base font-bold text-zinc-100">{currency(ad.startingPrice)}</span>
        </div>
      </article>
    </Link>
  );
}
