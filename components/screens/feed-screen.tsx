"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ads, cities } from "@/lib/mock-data";
import type { ProfessionalAd } from "@/lib/types";
import { currency, cn } from "@/lib/utils";

const quickFilters = ["Premium", "Livre Agora", "Com local"];
const defaultLocationLabel = "São Paulo, SP";
const defaultGender = "Todas";
const defaultMaxPrice = 1500;

const normalizeText = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const categoryByGender: Record<string, string> = {
  Todas: "",
  Mulher: "Feminino",
  Homem: "Masculino",
  Trans: "Trans",
  Casal: "Casais",
};

export function FeedScreen() {
  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [visibleQuickFilters, setVisibleQuickFilters] = useState<string[]>(quickFilters);
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState(defaultLocationLabel);
  const [locationInput, setLocationInput] = useState(defaultLocationLabel);
  const [showLocationEditor, setShowLocationEditor] = useState(false);

  // Estados dos Filtros
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedGender, setSelectedGender] = useState(defaultGender);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);
  const [selectedAdTypes, setSelectedAdTypes] = useState<string[]>([]);
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [selectedHairs, setSelectedHairs] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Funções auxiliares para os filtros de multipla escolha
  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
  };

  const normalizedLocationQuery = locationInput.toLowerCase().trim();
  const locationMatches = cities.filter((city) => city.toLowerCase().includes(normalizedLocationQuery));

  const clearFilters = () => {
    setSelectedCity("all");
    setSelectedGender(defaultGender);
    setMaxPrice(defaultMaxPrice);
    setSelectedAdTypes([]);
    setSelectedEthnicities([]);
    setSelectedHairs([]);
    setSelectedServices([]);
    setActiveQuickFilters([]);
    setVisibleQuickFilters(quickFilters);
  };

  const clearFiltersFromModal = () => {
    clearFilters();
    setVisibleQuickFilters([]);
  };

  const toggleQuickFilter = (filter: string) => {
    setActiveQuickFilters((current) => {
      const isActive = current.includes(filter);
      const next = isActive ? current.filter((item) => item !== filter) : [...current, filter];

      // Remover da lista de filtros visíveis quando desmarcar
      if (isActive) {
        setVisibleQuickFilters((visible) => visible.filter((item) => item !== filter));
      }

      if (filter === "Premium") {
        setSelectedAdTypes((types) => {
          if (isActive) {
            return types.filter((item) => item !== "Premium");
          }

          return types.includes("Premium") ? types : [...types, "Premium"];
        });
      }

      return next;
    });
  };

  const toggleAdTypeFilter = (type: string) => {
    setSelectedAdTypes((current) => {
      const isActive = current.includes(type);
      const next = isActive ? current.filter((item) => item !== type) : [...current, type];

      if (type === "Premium") {
        setActiveQuickFilters((quickCurrent) => {
          if (isActive) {
            return quickCurrent.filter((item) => item !== "Premium");
          }

          return quickCurrent.includes("Premium") ? quickCurrent : [...quickCurrent, "Premium"];
        });

        setVisibleQuickFilters((visibleCurrent) => {
          if (isActive) {
            return visibleCurrent.filter((item) => item !== "Premium");
          }

          return visibleCurrent.includes("Premium") ? visibleCurrent : [...visibleCurrent, "Premium"];
        });
      }

      return next;
    });
  };

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const cityMatch = selectedCity === "all" || ad.city === selectedCity;
      const priceMatch = ad.startingPrice <= maxPrice;
      const selectedCategory = categoryByGender[selectedGender];
      const categoryMatch = selectedGender === defaultGender || ad.category === selectedCategory;

      const selectedAdTiers = new Set<string>();
      if (selectedAdTypes.includes("Premium") || activeQuickFilters.includes("Premium")) {
        selectedAdTiers.add("premium");
      }
      if (selectedAdTypes.includes("Standard")) {
        selectedAdTiers.add("normal");
      }
      const adTypeMatch = selectedAdTiers.size === 0 || selectedAdTiers.has(ad.adTier);

      const quickStatusMatch = !activeQuickFilters.includes("Livre Agora") || ad.status === "livre";
      const quickLocalMatch = !activeQuickFilters.includes("Com local") || ad.services.some((service) => {
        const normalizedService = normalizeText(service);
        return normalizedService.includes("hotel") || normalizedService.includes("local");
      });

      const ethnicityMatch = selectedEthnicities.length === 0 || selectedEthnicities.some((ethnicity) => {
        const normalizedEthnicity = normalizeText(ethnicity);
        const adEthnicity = normalizeText(ad.ethnicity);
        if (normalizedEthnicity === "caucasiana") return adEthnicity.includes("branca") || adEthnicity.includes("cauc");
        if (normalizedEthnicity === "negra") return adEthnicity.includes("negra") || adEthnicity.includes("preta");
        if (normalizedEthnicity === "asiatica") return adEthnicity.includes("asiat");
        if (normalizedEthnicity === "latina") return adEthnicity.includes("latin") || adEthnicity.includes("parda");
        return adEthnicity.includes(normalizedEthnicity);
      });

      const hairMatch = selectedHairs.length === 0 || selectedHairs.some((hair) => {
        const normalizedHair = normalizeText(hair);
        const adHair = normalizeText(ad.hairColor);
        if (normalizedHair === "loira") return adHair.includes("loiro") || adHair.includes("loira");
        if (normalizedHair === "morena") return adHair.includes("castanho") || adHair.includes("moreno") || adHair.includes("preto");
        if (normalizedHair === "ruiva") return adHair.includes("ruiv");
        return adHair.includes(normalizedHair);
      });

      const serviceMatch = selectedServices.length === 0 || selectedServices.some((service) => {
        const normalizedSelection = normalizeText(service);
        return ad.services.some((adService) => {
          const normalizedService = normalizeText(adService);
          if (normalizedSelection.includes("jantares")) return normalizedService.includes("jantar") || normalizedService.includes("evento");
          if (normalizedSelection.includes("viagem")) return normalizedService.includes("viagem") || normalizedService.includes("tour");
          return normalizedService.includes(normalizedSelection);
        });
      });

      return cityMatch && priceMatch && categoryMatch && adTypeMatch && quickStatusMatch && quickLocalMatch && ethnicityMatch && hairMatch && serviceMatch;
    });
  }, [activeQuickFilters, maxPrice, selectedCity, selectedGender, selectedAdTypes, selectedEthnicities, selectedHairs, selectedServices]);

  useEffect(() => {
    setVisibleCount(6);
  }, [activeQuickFilters, maxPrice, selectedCity, selectedGender, selectedAdTypes, selectedEthnicities, selectedHairs, selectedServices]);

  const activeAdvancedChips = [
    selectedCity !== "all" ? { id: `city-${selectedCity}`, label: selectedCity, onRemove: () => setSelectedCity("all") } : null,
    selectedGender !== defaultGender ? { id: `gender-${selectedGender}`, label: selectedGender, onRemove: () => setSelectedGender(defaultGender) } : null,
    maxPrice !== defaultMaxPrice ? { id: `price-${maxPrice}`, label: `Até ${currency(maxPrice)}`, onRemove: () => setMaxPrice(defaultMaxPrice) } : null,
    ...selectedAdTypes.filter((type) => type !== "Premium").map((type) => ({ id: `type-${type}`, label: type, onRemove: () => setSelectedAdTypes((current) => current.filter((item) => item !== type)) })),
    ...selectedEthnicities.map((ethnicity) => ({ id: `eth-${ethnicity}`, label: ethnicity, onRemove: () => setSelectedEthnicities((current) => current.filter((item) => item !== ethnicity)) })),
    ...selectedHairs.map((hair) => ({ id: `hair-${hair}`, label: hair, onRemove: () => setSelectedHairs((current) => current.filter((item) => item !== hair)) })),
    ...selectedServices.map((service) => ({ id: `service-${service}`, label: service, onRemove: () => setSelectedServices((current) => current.filter((item) => item !== service)) })),
  ].filter((chip): chip is { id: string; label: string; onRemove: () => void } => chip !== null);

  const visibleAds = filteredAds.slice(0, visibleCount);

  const applySelectedLocation = (city: string) => {
    setSelectedCity(city);
    setSelectedLocation(`${city}, SP`);
    setLocationInput(`${city}, SP`);
    setShowLocationEditor(false);
  };

  const useAutomaticLocation = () => {
    applySelectedLocation("Sao Paulo");
  };

  const renderFiltersContent = () => (
    <div className="space-y-6">
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
          {["Todas", "Mulher", "Homem", "Trans", "Casal"].map((gender) => (
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
                checked={type === "Premium" ? selectedAdTypes.includes(type) || activeQuickFilters.includes("Premium") : selectedAdTypes.includes(type)}
                onChange={() => toggleAdTypeFilter(type)}
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
    <AppShell location={selectedLocation}>
      <div className="space-y-6">
        {/* Barra Superior */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setLocationInput(selectedLocation);
                    setShowLocationEditor((current) => !current);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition hover:border-wine-300 hover:bg-wine-50/40"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-wine-700 shadow-sm ring-1 ring-zinc-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Alterar localização</span>
                    <span className="mt-1 block text-sm font-semibold text-zinc-900 underline decoration-dotted decoration-wine-300 underline-offset-4">{selectedLocation}</span>
                  </span>
                  <span className="text-zinc-400">▾</span>
                </button>

                {showLocationEditor ? (
                  <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-full rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-900/10">
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500" aria-hidden="true">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <input
                        value={locationInput}
                        onChange={(event) => setLocationInput(event.target.value)}
                        placeholder="Digite sua cidade"
                        className="h-9 w-full border-0 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                        autoFocus
                      />
                    </div>

                    <div className="mt-3 max-h-48 space-y-1 overflow-y-auto pr-1">
                      {locationMatches.length > 0 ? (
                        locationMatches.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => applySelectedLocation(city)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                          >
                            <span>{city}, SP</span>
                            <span className="text-xs text-zinc-400">Selecionar</span>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-500">Nenhuma cidade encontrada</div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button variant="secondary" onClick={useAutomaticLocation} className="justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2" aria-hidden="true">
                          <path d="M12 2v4" />
                          <path d="M12 18v4" />
                          <path d="m4.93 4.93 2.83 2.83" />
                          <path d="m16.24 16.24 2.83 2.83" />
                          <path d="M2 12h4" />
                          <path d="M18 12h4" />
                          <path d="m4.93 19.07 2.83-2.83" />
                          <path d="m16.24 7.76 2.83-2.83" />
                        </svg>
                        Usar localização automática
                      </Button>
                      <Button variant="ghost" onClick={() => setShowLocationEditor(false)} className="justify-center text-zinc-700">
                        Fechar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Botão de Filtros só aparece no Mobile (escondido no lg) */}
              <Button variant="secondary" className="md:mt-6 lg:hidden" onClick={() => setShowFilters(true)}>
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-red-500">
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
                </span>
              </Button>
            </div>
            {visibleQuickFilters.length > 0 || activeAdvancedChips.length > 0 ? (
              <div className="no-scrollbar -mx-1 mt-3 overflow-x-auto px-1">
                <div className="flex min-w-max items-center gap-2 pb-1">
                  {visibleQuickFilters.map((filter) => {
                    const active = activeQuickFilters.includes(filter);
                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => toggleQuickFilter(filter)}
                        className={cn(
                          "relative whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          active ? "border-wine-700 bg-wine-700 pr-6 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-wine-300 hover:bg-wine-50"
                        )}
                      >
                        {filter}
                        {active ? (
                          <span
                            role="button"
                            aria-label={`Remover filtro ${filter}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleQuickFilter(filter);
                            }}
                            className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-wine-700 ring-1 ring-wine-200"
                          >
                            x
                          </span>
                        ) : null}
                      </button>
                    );
                  })}

                  {activeAdvancedChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={chip.onRemove}
                      className="relative whitespace-nowrap rounded-full border border-wine-300 bg-wine-100 px-3 py-1.5 pr-6 text-xs font-medium text-wine-800 transition hover:bg-wine-200"
                    >
                      {chip.label}
                      <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-wine-700 ring-1 ring-wine-200">
                        x
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Menu Lateral Desktop */}
          <aside className="hidden lg:flex flex-col shrink-0">
            <div className="sticky top-24 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
              {/* Filter Header com Ícone de Filtros */}
              <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
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
                  <FeedAdCard key={ad.id} ad={ad} />
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
        title="Filtros avançados"
        description="Refine sua busca para encontrar o perfil ideal."
        headerActions={
          <button
            type="button"
            onClick={clearFiltersFromModal}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 20H7l-4-4 10-10 7 7-6 7Z" />
              <path d="M11 11 17 17" />
            </svg>
            Limpar
          </button>
        }
        actions={null}
      >
        {renderFiltersContent()}
      </Modal>
    </AppShell>
  );
}

function FeedAdCard({ ad }: { ad: ProfessionalAd }) {
  const [imageIndex, setImageIndex] = useState(0);
  const isPremium = ad.adTier === "premium";

  // Ref para injecao de variaveis CSS (Alta Performance / Zero-Lag)
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePremiumMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = (x / rect.width - 0.5) * 2;
    const centerY = (y / rect.height - 0.5) * 2;
    const maxTilt = 8;

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
      <Link href={`/anuncio/${ad.slug}`} className="group block h-full perspective-1000">
        <article
          ref={cardRef}
          className="preserve-3d relative h-full min-h-85 w-full cursor-pointer transition-transform duration-200 ease-out active:scale-[0.97]"
          style={{
            transform: "rotateX(var(--rot-x, 0deg)) rotateY(var(--rot-y, 0deg))",
          }}
          onMouseMove={handlePremiumMouseMove}
          onMouseLeave={handlePremiumMouseLeave}
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl border border-[#DAA520] bg-zinc-950 shadow-sm transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgba(218,165,32,0.22)]">
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
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", ad.status === "livre" ? "border border-emerald-800/50 bg-emerald-950/80 text-emerald-400" : ad.status === "em_atendimento" ? "border border-amber-800/50 bg-amber-950/80 text-amber-400" : "border border-zinc-700/50 bg-zinc-900/80 text-zinc-400")}>
                  {ad.status === "livre" ? "Livre" : ad.status === "em_atendimento" ? "Em atendimento" : "Indisponivel"}
                </span>
              </div>
              <h3 className="font-display text-2xl font-semibold leading-tight text-[#FFDF00] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {ad.artisticName}
              </h3>
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
        </article>
      </Link>
    );
  }

  // Card Standard Original (Adicionado h-full e active:scale para padronizacao)
  return (
    <Link href={`/anuncio/${ad.slug}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-wine-200 active:scale-[0.97]">
        <div className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-zinc-800 shadow-sm">★ {ad.rating.toFixed(1)}</div>

        <div className="relative h-64 shrink-0 overflow-hidden bg-zinc-100">
          <Image
            src={currentImage}
            alt={`${ad.artisticName} em ${ad.city}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100 z-10" />
        </div>

        <div className="relative flex flex-1 flex-col justify-between p-2.5 pl-3.5">
          <div className={cn("absolute inset-y-0 left-0 w-1.5", ad.status === "livre" ? "bg-emerald-500" : ad.status === "em_atendimento" ? "bg-amber-500" : "bg-zinc-400")} />
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div>
              <p className={cn("mb-0.5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium", ad.status === "livre" ? "bg-emerald-50 text-emerald-700" : ad.status === "em_atendimento" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600")}>{ad.status === "livre" ? "Livre" : ad.status === "em_atendimento" ? "Em atendimento" : "Indisponivel"}</p>
              <h3 className="text-base font-semibold text-zinc-900">{ad.artisticName}</h3>
              <p className="text-[11px] text-zinc-500">{ad.neighborhood}, {ad.city}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-1.5">
            <p className="text-[10px] font-bold uppercase text-zinc-400">A partir de <span className="block text-sm font-black text-zinc-900">{currency(ad.startingPrice)}</span></p>
            <span className="rounded-lg bg-wine-50 px-3 py-1.5 text-xs font-bold text-wine-700 opacity-0 transition-opacity group-hover:opacity-100">Ver perfil</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
