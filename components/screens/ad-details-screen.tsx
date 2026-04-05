"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
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
  const ad = useMemo(() => ads.find((item) => item.slug === slug), [slug]);
  const adReviews = reviews.filter((review) => review.adId === ad?.id);

  if (!ad) {
    return (
      <AppShell>
        <EmptyState title="Perfil nao encontrado" description="Esse anuncio pode ter sido removido ou alterado." />
      </AppShell>
    );
  }

  return (
    <AppShell location={`${ad.city}, ${ad.state}`}>
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="relative h-72 md:col-span-2 sm:h-96">
            <Image src={ad.images[0]} alt={ad.artisticName} fill className="rounded-2xl object-cover" sizes="(max-width: 768px) 100vw, 66vw" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
            {ad.images.slice(1, 3).map((image, index) => (
              <div key={image} className="relative h-36 sm:h-44 md:h-full md:min-h-47">
                <Image src={image} alt={`${ad.artisticName} galeria ${index + 2}`} fill className="rounded-2xl object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-semibold text-zinc-900">{ad.artisticName}</h1>
                  <p className="text-sm text-zinc-500">{ad.displayName} | {ad.neighborhood}, {ad.city}</p>
                </div>
                <StatusBadge status={ad.status} />
              </div>

              <p className="text-sm leading-relaxed text-zinc-700">{ad.description}</p>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Servicos oferecidos</h2>
                <div className="mt-2 flex flex-wrap gap-2">{ad.services.map((service) => <span key={service} className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">{service}</span>)}</div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Tabela de valores</h2>
                <ul className="mt-2 space-y-2 text-sm">
                  {ad.pricingTable.map((row) => (
                    <li key={row.label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2">
                      <span>{row.label}</span>
                      <strong>{currency(row.price)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="space-y-3">
              <h2 className="text-lg font-semibold text-zinc-900">Comentarios e avaliacoes</h2>
              {adReviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-zinc-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-900">{review.author}</p>
                    <p className="text-sm text-amber-600">{review.score.toFixed(1)} / 5</p>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{review.comment}</p>
                </article>
              ))}
            </Card>
          </div>

          <aside className="space-y-3">
            <Card className="space-y-3">
              <p className="text-sm text-zinc-600">A partir de</p>
              <p className="text-2xl font-semibold text-zinc-900">{currency(ad.startingPrice)}</p>

              {role === "visitor" ? (
                <Link href="/auth/login" className="block">
                  <Button fullWidth>Entrar para interagir</Button>
                </Link>
              ) : (
                <Link href="/chat" className="block">
                  <Button fullWidth>Iniciar chat</Button>
                </Link>
              )}

              {role === "cliente" ? (
                <Link href="/checkout" className="block">
                  <Button fullWidth variant="secondary">Contratar com custodia</Button>
                </Link>
              ) : role === "profissional" ? (
                <Link href="/profissional/dashboard" className="block">
                  <Button fullWidth variant="secondary">Ir para o painel</Button>
                </Link>
              ) : null}
              <Button fullWidth variant="ghost" onClick={() => setRiskTarget("WhatsApp")}>Abrir WhatsApp</Button>
              <Button fullWidth variant="ghost" onClick={() => setRiskTarget("Telegram")}>Abrir Telegram</Button>
            </Card>
            <Card className="text-sm text-zinc-600">Perfil verificado com media {ad.rating.toFixed(1)} ({ad.reviewsCount} avaliacoes).</Card>
          </aside>
        </section>
      </div>

      <RiskWarningModal
        open={Boolean(riskTarget)}
        onClose={() => setRiskTarget(null)}
        targetLabel={riskTarget ?? "canal externo"}
        onConfirm={() => {
          setRiskTarget(null);
          if (typeof window !== "undefined") window.open("https://web.whatsapp.com", "_blank", "noopener,noreferrer");
        }}
      />
    </AppShell>
  );
}
