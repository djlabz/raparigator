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
import { Skeleton } from "@/components/ui/skeleton";
import { ads, categories, cities } from "@/lib/mock-data";
import { currency, cn } from "@/lib/utils";

const quickFilters = ["Premium", "Livre agora", "Ate R$ 500", "Verificadas"];

// Estilos customizados injetados para a scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #80002033; border-radius: 10px; }
`;

export function FeedScreen() {
  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  // Estados dos Filtros
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedGender, setSelectedGender] = useState("Mulher");
  const [maxPrice, setMaxPrice] = useState(1500);
  const [selectedAdTypes, setSelectedAdTypes] = useState<string[]>(["Premium"]);
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [selectedHairs, setSelectedHairs] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Funções auxiliares para os filtros de multipla escolha
  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const clearFilters = () => {
    setSelectedCity("all");
    setSelectedGender("Mulher");
    setMaxPrice(1500);
    setSelectedAdTypes([]);
    setSelectedEthnicities([]);
    setSelectedHairs([]);
    setSelectedServices([]);
  };

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const cityMatch = selectedCity === "all" || ad.city === selectedCity;
      const priceMatch = ad.startingPrice <= maxPrice;
      return cityMatch && priceMatch;
    });
  }, [maxPrice, selectedCity, selectedGender, selectedAdTypes, selectedEthnicities, selectedHairs, selectedServices]);

  const visibleAds = filteredAds.slice(0, visibleCount);

  const renderFiltersContent = () => (
    <div className="space-y-8">
      {/* Localidade */}
      <section>
        <label className="text-sm font-bold text-zinc-900 mb-3 block">Localidade</label>
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full rounded-lg border-wine-200 bg-wine-50/50 py-2.5 pl-3 pr-10 text-sm font-medium focus:border-wine-700 focus:ring-1 focus:ring-wine-700 outline-none appearance-none"
          >
            <option value="all">Todas as regiões</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <span className="absolute right-3 top-2.5 text-wine-700/50 pointer-events-none">▼</span>
        </div>
      </section>

      {/* Gênero & Categoria */}
      <section>
        <label className="text-sm font-bold text-zinc-900 mb-3 block">Gênero & Categoria</label>
        <div className="grid grid-cols-2 gap-2">
          {["Mulher", "Homem", "Trans", "Casal"].map((gender) => (
            <button
              key={gender}
              onClick={() => setSelectedGender(gender)}
              className={cn(
                "py-2 px-3 rounded-lg text-xs font-semibold transition-colors border",
                selectedGender === gender
                  ? "border-wine-700 bg-wine-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-wine-300 hover:bg-wine-50"
              )}
            >
              {gender}
            </button>
          ))}
        </div>
      </section>

      {/* Preço */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-bold text-zinc-900">Investimento (h)</label>
          <span className="text-xs font-bold text-wine-700">Ate {currency(maxPrice)}</span>
        </div>
        <input
          type="range" min={200} max={3000} step={50}
          value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-200 rounded-full cursor-pointer appearance-none accent-wine-700"
        />
        <div className="flex justify-between mt-2 text-[10px] text-zinc-400 font-bold uppercase">
          <span>R$ 200</span>
          <span>R$ 3.000</span>
        </div>
      </section>

      {/* Tipo de Anúncio */}
      <section>
        <label className="text-sm font-bold text-zinc-900 mb-3 block">Tipo de Anúncio</label>
        <div className="space-y-2">
          {["Premium", "Standard"].map((type) => (
            <label key={type} className="flex items-center gap-3 p-2 rounded-lg hover:bg-wine-50/50 cursor-pointer transition-colors group">
              <input
                type="checkbox"
                checked={selectedAdTypes.includes(type)}
                onChange={() => toggleSelection(setSelectedAdTypes, type)}
                className="rounded border-zinc-300 text-wine-700 focus:ring-wine-700 w-4 h-4 accent-wine-700 cursor-pointer"
              />
              <span className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                {type === "Premium" && <span className="text-wine-700 text-sm">★</span>}
                {type}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Características Físicas */}
      <section className="space-y-5">
        <div>
          <label className="text-sm font-bold text-zinc-900 mb-2 block">Etnia</label>
          <div className="flex flex-wrap gap-2">
            {["Caucasiana", "Negra", "Asiática", "Latina"].map((eth) => (
              <button
                key={eth} onClick={() => toggleSelection(setSelectedEthnicities, eth)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors", selectedEthnicities.includes(eth) ? "bg-wine-100 border-wine-300 text-wine-800" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")}
              >
                {eth}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-zinc-900 mb-2 block">Cabelo</label>
          <div className="flex flex-wrap gap-2">
            {["Loira", "Morena", "Ruiva"].map((hair) => (
              <button
                key={hair} onClick={() => toggleSelection(setSelectedHairs, hair)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors", selectedHairs.includes(hair) ? "bg-wine-100 border-wine-300 text-wine-800" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")}
              >
                {hair}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section>
        <label className="text-sm font-bold text-zinc-900 mb-3 block">Serviços</label>
        <div className="space-y-2">
          {["Viagem / Tour", "Jantares e Eventos", "Fetiches"].map((service) => (
            <label key={service} className="flex items-center gap-3 text-sm font-medium text-zinc-700 cursor-pointer hover:bg-wine-50/50 p-2 -ml-2 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => toggleSelection(setSelectedServices, service)}
                className="rounded border-zinc-300 text-wine-700 focus:ring-wine-700 w-4 h-4 accent-wine-700 cursor-pointer"
              />
              {service}
            </label>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <AppShell location="Sao Paulo, SP">
      <style>{scrollbarStyles}</style>

      <div className="space-y-6">
        {/* Barra Superior */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <Input id="search-location" label="Alterar localizacao" placeholder="Sao Paulo, SP" defaultValue="Sao Paulo, SP" />
              <Button variant="secondary" className="md:mt-6" onClick={() => setShowFilters(true)}>Filtros avancados</Button>
              <Button variant="ghost" className="md:mt-6" onClick={() => setSimulateError((value) => !value)}>{simulateError ? "Ocultar erro" : "Simular erro"}</Button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {quickFilters.map((filter) => (
                <button key={filter} className="whitespace-nowrap rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-wine-300 hover:bg-wine-50">{filter}</button>
              ))}
            </div>
          </div>
          {simulateError ? <Card className="border-red-200 bg-red-50 text-red-800">Nao foi possivel atualizar os anuncios agora. Tente novamente em alguns instantes.</Card> : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Menu Lateral Desktop */}
          <aside className="hidden lg:flex flex-col shrink-0">
            <div className="sticky top-24 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
              {/* Filter Header com Ícone de Filtros */}
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine-700">
                    <line x1="21" x2="14" y1="4" y2="4" />
                    <line x1="10" x2="3" y1="4" y2="4" />
                    <line x1="21" x2="12" y1="12" y2="12" />
                    <line x1="8" x2="3" y1="12" y2="12" />
                    <line x1="21" x2="16" y1="20" y2="20" />
                    <line x1="12" x2="3" y1="20" y2="20" />
                    <line x1="14" x2="14" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="10" y2="14" />
                    <line x1="16" x2="16" y1="18" y2="22" />
                  </svg>
                  Filtros
                </h3>
                <button onClick={clearFilters} className="text-xs font-bold text-wine-700 hover:underline uppercase tracking-wider">Limpar</button>
              </div>

              {/* Filter Body with Custom Scroll */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
                {renderFiltersContent()}
              </div>

              {/* Filter Footer */}
              <div className="p-5 border-t border-zinc-100 bg-zinc-50/50">
                <Button className="w-full shadow-lg shadow-wine-700/20" onClick={() => { }}>Aplicar Filtros</Button>
              </div>
            </div>
          </aside>

          {/* Grid de Anúncios */}
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h1 className="text-2xl font-extrabold text-zinc-900">Acompanhantes</h1>
                <p className="text-zinc-500 mt-1 text-sm">{filteredAds.length} perfis encontrados</p>
              </div>
            </div>

            {loadingMore ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-80" />)}</div>
            ) : visibleAds.length === 0 ? (
              <EmptyState title="Nenhum anuncio encontrado" description="Ajuste os filtros para encontrar perfis compativeis com sua busca." actionLabel="Resetar filtros" onAction={clearFilters} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleAds.map((ad) => (
                  <Link key={ad.id} href={`/anuncio/${ad.slug}`} className="group block">
                    <article className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-wine-200">
                      <div className={cn("absolute inset-y-0 left-0 w-1.5", ad.status === "livre" ? "bg-emerald-500" : ad.status === "em_atendimento" ? "bg-amber-500" : "bg-zinc-400")} />
                      <div className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-zinc-800 shadow-sm">★ {ad.rating.toFixed(1)}</div>

                      <div className="relative h-56 bg-zinc-100 overflow-hidden">
                        <Image src={ad.images[0]} alt={`${ad.artisticName} em ${ad.city}`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                          {ad.adTier === "premium" && (
                            <span className="rounded-full bg-wine-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-wine-700">Premium</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                          <p className="text-[10px] uppercase font-bold text-zinc-400">A partir de <span className="text-sm font-black text-wine-700 block">{currency(ad.startingPrice)}</span></p>
                          <span className="text-xs font-bold text-wine-700 opacity-0 transition-opacity group-hover:opacity-100 bg-wine-50 px-3 py-1.5 rounded-lg">Ver perfil</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}

            {visibleCount < filteredAds.length ? (
              <div className="flex justify-center pt-6">
                <Button onClick={() => { setLoadingMore(true); setTimeout(() => { setVisibleCount((value) => value + 3); setLoadingMore(false); }, 900); }}>
                  Carregar mais anúncios
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {/* Modal Mobile */}
      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        description="Refine sua busca para encontrar o perfil ideal."
        actions={
          <>
            <Button variant="secondary" fullWidth onClick={clearFilters}>Limpar</Button>
            <Button fullWidth onClick={() => setShowFilters(false)}>Aplicar</Button>
          </>
        }
      >
        <div className="max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
          {renderFiltersContent()}
        </div>
      </Modal>
    </AppShell>
  );
}
