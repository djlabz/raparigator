"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Crown, MapPin, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RiskWarningModal } from "@/components/ui/risk-warning-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuthSession } from "@/lib/auth-session";
import { ads, reviews } from "@/lib/mock-data";
import { currency } from "@/lib/utils";

interface AdDetailsScreenProps {
  slug: string;
}

export function AdDetailsScreen({ slug }: AdDetailsScreenProps) {
  const { role } = useAuthSession();
  const [riskTarget, setRiskTarget] = useState<"WhatsApp" | "Telegram" | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const ad = useMemo(() => ads.find((item) => item.slug === slug), [slug]);
  const adReviews = reviews.filter((review) => review.adId === ad?.id);

  if (!ad) {
    return (
      <AppShell>
        <EmptyState title="Perfil nao encontrado" description="Esse anuncio pode ter sido removido ou alterado." />
      </AppShell>
    );
  }

  const isPremium = ad.adTier === "premium";
  const premiumAttributes = [
    { label: "Altura", value: `${ad.heightCm} cm`, icon: "/icons/attributes/size-woman.svg" },
    { label: "Idade", value: `${ad.age} anos`, icon: "/icons/attributes/age.svg" },
    { label: "Tipo e cor de cabelo", value: `${ad.hairType} • ${ad.hairColor}`, icon: "/icons/attributes/hair-woman.svg" },
    { label: "Cor dos olhos", value: ad.eyeColor, icon: "/icons/attributes/eye.svg" },
    { label: "Peso", value: `${ad.weightKg} kg`, icon: "/icons/attributes/weight.svg" },
  ];

  const nextPhoto = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % ad.images.length);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + ad.images.length) % ad.images.length);
    }
  };

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className="space-y-6">
        {isPremium && (
          <section className="relative isolate overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#121212] shadow-xl">
            <div className="relative h-48 w-full overflow-hidden bg-zinc-900 sm:h-64 md:h-72">
              <Image src={ad.images[0]} alt="Foto de capa premium" fill className="object-cover" priority sizes="100vw" />
              <div className="absolute inset-x-0 bottom-0 z-10 h-32 bg-linear-to-t from-[#121212] via-[#121212]/70 to-transparent" />
            </div>

            <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-black/20 via-black/40 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,223,0,0.02)_0%,transparent_40%,rgba(218,165,32,0.03)_100%)]" />

            <div className="pointer-events-none absolute right-4 top-51 z-20 flex opacity-35 sm:right-8 sm:top-68 md:right-12 md:top-76">
              <Crown className="h-24 w-24 max-h-full max-w-full aspect-square fill-red-600/15 text-red-600 sm:h-32 sm:w-32 md:h-40 md:w-40" />
            </div>

            <div className="relative z-10 w-full px-4 pb-5 sm:px-8 sm:pb-6 md:px-12 md:pb-8">
              <div className="flex flex-col gap-5 md:gap-6">
                <div className="relative -mt-12 flex flex-col gap-4 sm:-mt-16 md:-mt-20 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-end gap-4">
                    <div className="relative inline-block shrink-0 align-bottom">
                      <div className="relative z-10 h-24 w-24 rounded-full bg-linear-to-tr from-amber-300 via-[#a88222] to-amber-300 p-1 shadow-[0_0_20px_rgba(218,165,32,0.35)] sm:h-32 sm:w-32 md:h-36 md:w-36">
                        <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-[#121212]">
                          <Image
                            src={ad.images[1] || ad.images[0]}
                            alt={ad.artisticName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 144px"
                          />
                        </div>
                      </div>
                      <div className="absolute right-1 bottom-1 z-20 flex h-5 w-5 items-center justify-center rounded-full border-[3px] border-[#121212] bg-[#10b981] sm:right-2 sm:bottom-2 sm:h-6 sm:w-6">
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-2 pb-1 text-left">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <h1 className="font-display text-2xl font-bold text-[#FFDF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:text-3xl">{ad.artisticName}</h1>

                        <div className="flex items-center gap-1.5 self-start rounded-full border border-[#DAA520]/50 bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-500 shadow-sm backdrop-blur-md">
                          <Crown className="h-3.5 w-3.5 fill-amber-500" />
                          Premium
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <MapPin className="h-4 w-4 text-wine-500" />
                          {ad.neighborhood}, {ad.city}
                        </span>

                        <div className="flex items-center gap-1.5 font-medium text-[#10b981]">
                          <ShieldCheck className="h-4 w-4" />
                          Identidade Verificada
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                  {premiumAttributes.map((attribute) => (
                    <div
                      key={attribute.label}
                      className="flex min-h-20 items-center gap-2 rounded-2xl border border-white/8 bg-[#0c0c0c]/90 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm sm:min-h-24 sm:gap-3 sm:px-4 sm:py-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-black/55 sm:h-12 sm:w-12">
                        <Image src={attribute.icon} alt={attribute.label} width={34} height={34} className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300/85 sm:text-[11px] sm:tracking-[0.18em]">{attribute.label}</p>
                        <p className="wrap-break-word text-xs font-semibold text-zinc-100 sm:text-[15px]">{attribute.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {!isPremium && (
          <section className="relative h-64 w-full overflow-hidden rounded-2xl bg-zinc-950 shadow-md sm:h-80 md:h-96">
            <Image src={ad.images[0]} alt="Foto de capa standard" fill className="object-cover" priority sizes="100vw" />
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
                    />
                  </div>
                  <div className="absolute right-0.5 bottom-0.5 h-4 w-4 rounded-full border-2 border-white bg-[#10b981] sm:right-1 sm:bottom-1 sm:h-5 sm:w-5" />
                </div>

                <div className="space-y-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-2xl md:text-3xl">{ad.artisticName}</h1>
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
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card className="space-y-4">
              <div>
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-zinc-900">Sobre Mim</h2>
                <p className="text-sm leading-relaxed text-zinc-700">{ad.description}</p>
              </div>

              <hr className="border-t border-zinc-100" />

              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Servicos oferecidos</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ad.services.map((service) => (
                    <span key={service} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
                      {service}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-t border-zinc-100" />

              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Tabela de valores</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {ad.pricingTable.map((row) => (
                    <li key={row.label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                      <span className="text-zinc-600">{row.label}</span>
                      <strong className="font-medium text-zinc-900">{currency(row.price)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-zinc-900">Galeria de Fotos</h2>
                <span className="font-mono text-xs text-zinc-500">{ad.images.length} fotos</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {ad.images.map((img, index) => (
                  <div
                    key={img}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="group relative aspect-3/4 cursor-pointer overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/50 transition-all hover:opacity-95"
                  >
                    <Image
                      src={img}
                      alt={`${ad.artisticName} galeria ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-xs">Ampliar</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-900">Comentarios e avaliacoes</h2>
              {adReviews.length === 0 ? (
                <p className="py-2 text-sm text-zinc-500">Nenhum comentario ou avaliacao recente no momento.</p>
              ) : (
                adReviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-zinc-200/60 bg-zinc-50/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-zinc-900">{review.author}</p>
                      <p className="text-sm font-semibold text-amber-600">{review.score.toFixed(1)} / 5</p>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{review.comment}</p>
                  </article>
                ))
              )}
            </Card>
          </div>

          <aside className="space-y-3">
            <Card className="space-y-3 p-5">
              <p className="text-sm text-zinc-600">A partir de</p>
              <p className="font-display text-3xl font-bold text-zinc-900">{currency(ad.startingPrice)}</p>

              {role === "visitor" ? (
                <Link href="/auth/login" className="block w-full">
                  <Button fullWidth>Entrar para interagir</Button>
                </Link>
              ) : (
                <Link href="/chat" className="block w-full">
                  <Button fullWidth>Iniciar chat</Button>
                </Link>
              )}

              {role === "cliente" ? (
                <Link href="/checkout" className="block w-full">
                  <Button fullWidth variant="secondary">Contratar com custodia</Button>
                </Link>
              ) : role === "profissional" ? (
                <Link href="/profissional/dashboard" className="block w-full">
                  <Button fullWidth variant="secondary">Ir para o painel</Button>
                </Link>
              ) : null}

              <div className="relative flex items-center py-1">
                <div className="grow border-t border-zinc-200" />
                <span className="mx-4 shrink text-xs font-medium text-zinc-400">Ou canais externos</span>
                <div className="grow border-t border-zinc-200" />
              </div>

              <Button fullWidth variant="ghost" className="border border-zinc-200 hover:bg-zinc-50" onClick={() => setRiskTarget("WhatsApp")}>
                Abrir WhatsApp
              </Button>
              <Button fullWidth variant="ghost" className="border border-zinc-200 hover:bg-zinc-50" onClick={() => setRiskTarget("Telegram")}>
                Abrir Telegram
              </Button>
            </Card>

            <Card className="border-zinc-200/50 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500">
              Perfil verificado com media {ad.rating.toFixed(1)} ({ad.reviewsCount} avaliacoes).
            </Card>
          </aside>
        </section>
      </div>

      {selectedPhotoIndex !== null && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-zinc-950/95 p-4 backdrop-blur-xs">
          <button
            onClick={() => setSelectedPhotoIndex(null)}
            className="absolute top-4 right-4 z-110 cursor-pointer rounded-full bg-black/40 p-2.5 text-white hover:bg-black/70"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={prevPhoto}
            className="absolute top-1/2 left-3 z-110 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-3 text-white hover:bg-black/70"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative aspect-3/4 max-h-[80vh] max-w-full sm:max-w-2xl">
            <Image
              src={ad.images[selectedPhotoIndex]}
              alt={`Foto de detalhe ${selectedPhotoIndex + 1}`}
              fill
              className="rounded-lg object-contain"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          <button
            onClick={nextPhoto}
            className="absolute top-1/2 right-3 z-110 -translate-y-1/2 cursor-pointer rounded-full bg-black/40 p-3 text-white hover:bg-black/70"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 font-mono text-sm text-zinc-300">
            {selectedPhotoIndex + 1} de {ad.images.length}
          </div>
        </div>
      )}

      <RiskWarningModal
        open={Boolean(riskTarget)}
        onClose={() => setRiskTarget(null)}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined") window.open(riskTarget === "WhatsApp" ? "https://web.whatsapp.com" : "https://telegram.org", "_blank", "noopener,noreferrer");
        }}
      />
    </AppShell>
  );
}
