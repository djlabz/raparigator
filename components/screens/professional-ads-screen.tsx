"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ads } from "@/lib/mock-data";
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
            <Card key={ad.id} className="space-y-3">
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
          ))}
        </div>
      </div>
    </AppShell>
  );
}
