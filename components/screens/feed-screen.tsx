"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
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
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialLocation = searchParams.get("location") || "";
  const initialCity = initialLocation ? initialLocation.split(", ")[1] || "all" : "all";

  const [visibleCount, setVisibleCount] = useState(6);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationToolsModal, setShowLocationToolsModal] = useState(false);
  const [showLocationToast, setShowLocationToast] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState(initialLocation);

  // Estados dos Filtros
  const [selectedCity, setSelectedCity] = useState(initialCity);
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
  const locationMatches = normalizedLocationQuery.length < 2
    ? []
    : cities.filter((city) => city.toLowerCase().includes(normalizedLocationQuery));

  const clearFilters = () => {
    setSelectedCity("all");
    setSelectedGender(defaultGender);
    setMaxPrice(defaultMaxPrice);
    setSelectedAdTypes([]);
    setSelectedEthnicities([]);
    setSelectedHairs([]);
    setSelectedServices([]);
    setActiveQuickFilters([]);
  };

  const clearFiltersFromModal = () => {
    clearFilters();
  };

  const toggleQuickFilter = (filter: string) => {
    setActiveQuickFilters((current) => {
      const isActive = current.includes(filter);
      const next = isActive ? current.filter((item) => item !== filter) : [...current, filter];

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

  const visibleAds = filteredAds.slice(0, visibleCount);
  const selectedLocation = selectedCity === "all" ? defaultLocationLabel : `SP, ${selectedCity}`;

  const applySelectedLocation = (city: string) => {
    setSelectedCity(city);
    setLocationInput(city);
    setShowLocationToolsModal(false);
  };

  const useAutomaticLocation = () => {
    setSelectedCity("Sao Paulo");
    setLocationInput("Sao Paulo");
    setShowLocationToast(true);
    setTimeout(() => setShowLocationToast(false), 3000);
    // Não fecha o modal - apenas preenche o campo
  };

  const renderFiltersContent = () => (
    <div className="space-y-6">
      {/* Filtros rápidos */}
      <section>
        <label className="mb-3 block text-sm font-bold text-zinc-900">Filtros rápidos</label>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => {
            const active = activeQuickFilters.includes(filter);

            return (
              <button
                key={filter}
                type="button"
                onClick={() => toggleQuickFilter(filter)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active ? "border-wine-700 bg-wine-700 text-white" : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-wine-300 hover:bg-wine-50"
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </section>

      {/* Localidade */}
      <section>
        <label className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine-700" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Localidade
        </label>

        <button
          type="button"
          onClick={() => {
            setLocationInput(selectedCity === "all" ? "Sao Paulo" : selectedCity);
            setShowLocationToolsModal(true);
          }}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-left transition hover:border-wine-300 hover:bg-wine-50/50"
        >
          <span className="text-base font-medium text-zinc-900">{selectedCity === "all" ? "SP, São Paulo" : `SP, ${selectedCity}`}</span>
          <span className="text-wine-700/70">▾</span>
        </button>
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
        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Menu Lateral Desktop */}
          <aside className="hidden lg:flex min-w-70 flex-col shrink-0">
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
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-zinc-900">Acompanhantes</h1>
                <p className="text-zinc-500 mt-1 text-sm">{filteredAds.length} perfis encontrados</p>
              </div>

              {/* Botão de Filtros só aparece no Mobile (escondido no lg) */}
              <Button variant="secondary" className="lg:hidden" onClick={() => setShowFilters(true)}>
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

            {loadingMore ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="mx-auto h-120 w-full max-w-[320px] lg:max-w-none" />)}</div>
            ) : visibleAds.length === 0 ? (
              <EmptyState title="Nenhum anuncio encontrado" description="Ajuste os filtros para encontrar perfis compativeis com sua busca." actionLabel="Resetar filtros" onAction={clearFilters} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

      <Modal
        open={showLocationToolsModal}
        onClose={() => setShowLocationToolsModal(false)}
        title="Localidade"
        description=""
        actions={null}
      >
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-zinc-900">Selecionar nova localização</label>

          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-wine-700 shrink-0" aria-hidden="true">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <input
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Digite sua localização"
              className="h-9 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
            {locationInput && (
              <button
                type="button"
                onClick={() => {
                  setLocationInput("");
                  setSelectedCity("all");
                }}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-wine-300 bg-wine-50 text-sm font-bold text-wine-700 transition hover:bg-wine-100 active:scale-95"
                title="Remover localização"
              >
                ×
              </button>
            )}
          </div>

          {locationMatches.length > 0 ? (
            <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {locationMatches.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => applySelectedLocation(city)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                >
                  <span>SP, {city}</span>
                  <span className="text-xs text-zinc-400">Selecionar</span>
                </button>
              ))}
            </div>
          ) : null}

          <Button onClick={useAutomaticLocation} className="flex w-full items-center justify-center gap-2 bg-wine-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-wine-800 active:bg-wine-900">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="m16.24 16.24 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="m16.24 7.76 2.83-2.83" />
            </svg>
            <span className="whitespace-nowrap">Usar localização automática</span>
          </Button>

          {showLocationToast ? <Toast title="Localização atual aplicada" message="São Paulo, SP foi definida automaticamente." type="success" /> : null}
        </div>
      </Modal>
    </AppShell>
  );
}


const FEED_CARD_SIZE_CLASS = "h-[480px] w-full";

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
          className={cn("preserve-3d relative cursor-pointer transition-transform duration-200 ease-out active:scale-[0.97]", FEED_CARD_SIZE_CLASS)}
          style={{
            transform: "rotateX(var(--rot-x, 0deg)) rotateY(var(--rot-y, 0deg))",
          }}
          onMouseMove={handlePremiumMouseMove}
          onMouseLeave={handlePremiumMouseLeave}
        >
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 bg-[#120d03]" />
            <div
              className="absolute inset-[-150%] animate-spin bg-[conic-gradient(from_90deg,transparent_0%,transparent_75%,rgba(255,215,0,0.1)_80%,#FFD700_95%,#ffffff_98%,transparent_100%)] pointer-events-none"
              style={{ animationDuration: "6.5s", animationTimingFunction: "linear" }}
            />

            <div className="absolute inset-[2.5px] rounded-2xl overflow-hidden bg-[#121212] z-10 border border-[#a88222]/30 shadow-sm transition-shadow duration-300 group-hover:shadow-[0_8px_30px_rgba(218,165,32,0.22)]">
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
              <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-widest", statusClassName)}>
                {statusLabel}
              </span>
            </div>

            <h3 className="text-2xl font-semibold tracking-tight text-zinc-100 [text-shadow:0_2px_6px_rgba(0,0,0,0.85)]">
              {ad.artisticName}
            </h3>
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
