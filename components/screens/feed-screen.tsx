"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ads, categories, cities } from "@/lib/mock-data";
import { currency, cn } from "@/lib/utils";

const quickFilters = ["Premium", "Livre agora", "Ate R$ 500", "Verificadas"];

export function FeedScreen() {
  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [maxPrice, setMaxPrice] = useState(1200);
  const [loadingMore, setLoadingMore] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const categoryMatch = selectedCategory === "all" || ad.category === selectedCategory;
      const cityMatch = selectedCity === "all" || ad.city === selectedCity;
      const priceMatch = ad.startingPrice <= maxPrice;
      return categoryMatch && cityMatch && priceMatch;
    });
  }, [maxPrice, selectedCategory, selectedCity]);

  const visibleAds = filteredAds.slice(0, visibleCount);

  return (
    <AppShell location="Sao Paulo, SP">
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <Input id="search-location" label="Alterar localizacao" placeholder="Sao Paulo, SP" defaultValue="Sao Paulo, SP" />
              <Button variant="secondary" className="md:mt-6" onClick={() => setShowFilters(true)}>Filtros avancados</Button>
              <Button variant="ghost" className="md:mt-6" onClick={() => setSimulateError((value) => !value)}>{simulateError ? "Ocultar erro" : "Simular erro"}</Button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {quickFilters.map((filter) => (
                <button key={filter} className="whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-wine-300 hover:bg-wine-50">{filter}</button>
              ))}
            </div>
          </div>
          {simulateError ? <Card className="border-red-200 bg-red-50 text-red-800">Nao foi possivel atualizar os anuncios agora. Tente novamente em alguns instantes.</Card> : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden h-fit space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:block">
            <h2 className="text-base font-semibold text-zinc-900">Filtros</h2>
            <Select id="category-desktop" label="Categoria" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} options={[{ value: "all", label: "Todas" }, ...categories.map((value) => ({ value, label: value }))]} />
            <Select id="city-desktop" label="Localidade" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} options={[{ value: "all", label: "Todas" }, ...cities.map((value) => ({ value, label: value }))]} />
            <div>
              <label htmlFor="price" className="text-sm font-medium text-zinc-700">Faixa de preco ate {currency(maxPrice)}</label>
              <input id="price" type="range" min={200} max={1500} step={50} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-2 w-full accent-wine-700" />
            </div>
            <Button variant="secondary" onClick={() => { setSelectedCategory("all"); setSelectedCity("all"); setMaxPrice(1200); }}>Limpar filtros</Button>
          </aside>

          <div className="space-y-4">
            {loadingMore ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-80" />)}</div>
            ) : visibleAds.length === 0 ? (
              <EmptyState title="Nenhum anuncio encontrado" description="Ajuste os filtros para encontrar perfis compativeis com sua busca." actionLabel="Resetar" onAction={() => { setSelectedCategory("all"); setSelectedCity("all"); setMaxPrice(1200); }} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleAds.map((ad) => (
                  <Link
                    key={ad.id}
                    href={`/anuncio/${ad.slug}`}
                    className="group block"
                  >
                    <article className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-wine-200">
                      <div className={cn("absolute inset-y-0 left-0 w-1.5", ad.status === "livre" ? "bg-emerald-500" : ad.status === "em_atendimento" ? "bg-amber-500" : "bg-zinc-400")} />
                      <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-zinc-800 shadow-sm">★ {ad.rating.toFixed(1)}</div>

                      <div className="relative h-52 bg-zinc-100 overflow-hidden">
                        <Image
                          src={ad.images[0]}
                          alt={`${ad.artisticName} em ${ad.city}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      </div>

                      <div className="space-y-3 p-4 pl-5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn("mb-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium", ad.status === "livre" ? "bg-emerald-50 text-emerald-700" : ad.status === "em_atendimento" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600")}>
                              {ad.status === "livre" ? "Livre" : ad.status === "em_atendimento" ? "Em atendimento" : "Indisponivel"}
                            </p>
                            <h3 className="text-base font-semibold text-zinc-900 group-hover:text-wine-700 transition-colors">{ad.artisticName}</h3>
                            <p className="text-xs text-zinc-500">{ad.neighborhood}, {ad.city}</p>
                          </div>
                          <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", ad.adTier === "premium" ? "bg-wine-50 text-wine-700" : "bg-zinc-100 text-zinc-600")}>{ad.adTier}</span>
                        </div>
                        <p className="text-sm text-zinc-600 line-clamp-2">{ad.shortDescription}</p>
                        <div className="flex items-center justify-between pt-1">
                          <p className="text-sm text-zinc-700">A partir de <strong>{currency(ad.startingPrice)}</strong></p>
                          {/* Botão removido, a seta abaixo aparece sutilmente no hover se desejar, ou pode ser removida */}
                          <span className="text-xs font-medium text-wine-600 opacity-0 transition-opacity group-hover:opacity-100">Ver detalhes →</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}

            {visibleCount < filteredAds.length ? (
              <div className="flex justify-center pt-2">
                <Button onClick={() => { setLoadingMore(true); setTimeout(() => { setVisibleCount((value) => value + 3); setLoadingMore(false); }, 900); }}>Carregar mais anuncios</Button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <Modal open={showFilters} onClose={() => setShowFilters(false)} title="Filtros" description="Refine localidade, categoria e faixa de preco." actions={<><Button variant="secondary" fullWidth onClick={() => { setSelectedCategory("all"); setSelectedCity("all"); setMaxPrice(1200); }}>Limpar</Button><Button fullWidth onClick={() => setShowFilters(false)}>Aplicar</Button></>}>
        <div className="space-y-3">
          <Select id="category-mobile" label="Categoria" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} options={[{ value: "all", label: "Todas" }, ...categories.map((value) => ({ value, label: value }))]} />
          <Select id="city-mobile" label="Localidade" value={selectedCity} onChange={(event) => setSelectedCity(event.target.value)} options={[{ value: "all", label: "Todas" }, ...cities.map((value) => ({ value, label: value }))]} />
          <div>
            <label htmlFor="price-mobile" className="text-sm font-medium text-zinc-700">Faixa de preco ate {currency(maxPrice)}</label>
            <input id="price-mobile" type="range" min={200} max={1500} step={50} value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} className="mt-2 w-full accent-wine-700" />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
