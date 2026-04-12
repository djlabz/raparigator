"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ads } from "@/lib/mock-data";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/utils";

export function ProfessionalAdsScreen() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">Anúncios</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Gerencie seus perfis e destaques</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {ads.slice(0, 2).map((ad) => (
            <ProfessionalAdListCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function ProfessionalAdListCard({ ad }: { ad: ProfessionalAd }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [glareX, setGlareX] = useState(50);
  const [glareY, setGlareY] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;
    const maxTilt = 15;

    setTiltX(-((y - height / 2) / height) * maxTilt);
    setTiltY(((x - width / 2) / width) * maxTilt);
    setGlareX((x / width) * 100);
    setGlareY((y / height) * 100);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setTiltX(0);
    setTiltY(0);
    setGlareX(50);
    setGlareY(50);
    setIsHovering(false);
  };

  if (ad.adTier === "premium") {
    return (
      <article className="group perspective-1000 h-100 w-full cursor-pointer">
        <div
          className={cn("premium-flip-transition preserve-3d relative h-full w-full", isFlipped && "rotate-y-180")}
          onClick={() => setIsFlipped((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setIsFlipped((current) => !current);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? `Mostrar frente do card premium de ${ad.artisticName}` : `Mostrar detalhes premium de ${ad.artisticName}`}
          aria-pressed={isFlipped}
        >
          <div
            className="premium-gold-glow backface-hidden absolute inset-0 overflow-hidden rounded-2xl border border-[#DAA520]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
              transition: isHovering ? "transform 60ms linear" : "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Image
              src={ad.images[0] ?? ""}
              alt={`${ad.artisticName} premium`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.15)_0%,transparent_38%,rgba(218,165,32,0.18)_100%)] opacity-70" />

            <div className="absolute left-4 top-4 rounded-full border border-[#FFDF00]/35 bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFDF00]">
              Premium
            </div>

            <div className="absolute bottom-0 left-0 w-full px-5 pb-5 pt-16">
              <h3 className="font-display text-3xl font-semibold leading-tight text-[#FFDF00] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {ad.artisticName}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/75">Experiência exclusiva</p>
            </div>

            <div
              className="pointer-events-none absolute inset-0 mix-blend-color-dodge"
              style={{
                opacity: isHovering ? 1 : 0,
                transition: "opacity 280ms ease",
                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,223,0,0.44) 0%, rgba(218,165,32,0.18) 34%, rgba(184,134,11,0.08) 52%, transparent 72%)`,
              }}
            />
          </div>

          <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#B8860B] bg-zinc-950 p-5 text-white premium-gold-glow">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#DAA520]">Detalhes Premium</p>
              <h3 className="font-display text-2xl text-[#FFDF00]">{ad.artisticName}</h3>
              <p className="mt-4 border-t border-[#DAA520]/35 pt-4 text-sm text-zinc-200"><strong className="text-[#FFDF00]">Valor:</strong> A partir de {currency(ad.startingPrice)}</p>
              <p className="mt-2 text-sm text-zinc-200"><strong className="text-[#FFDF00]">Local:</strong> {ad.city}, {ad.state}</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">{ad.shortDescription}</p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", ad.status === "livre" ? "bg-emerald-50 text-emerald-700" : ad.status === "em_atendimento" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600")}>{ad.status === "livre" ? "Livre" : ad.status === "em_atendimento" ? "Em atendimento" : "Indisponivel"}</span>
              <Link
                href={`/anuncio/${ad.slug}`}
                className="inline-flex items-center rounded-lg border border-[#DAA520] bg-[#1a1404] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#FFDF00] transition-colors hover:bg-[#251b06]"
                onClick={(event) => event.stopPropagation()}
              >
                Ver anúncio público
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-zinc-900">{ad.artisticName}</p>
          <p className="text-sm text-zinc-600">
            {ad.city}, {ad.state} · A partir de {currency(ad.startingPrice)}
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">{ad.status}</span>
      </div>
      <p className="text-sm text-zinc-600">{ad.shortDescription}</p>
      <Link href={`/anuncio/${ad.slug}`}>
        <Button variant="secondary">Ver anúncio público</Button>
      </Link>
    </Card>
  );
}
