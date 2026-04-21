"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ads, cities } from "@/lib/mock-data";
import type { ProfessionalAd } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FeedAdCard } from "./feed-ad-card";
import { FeedFiltersContent } from "./feed-filters-content";
import { FeedLocationModal } from "./feed-location-modal";
import { categoryByGender, defaultGender, defaultLocationLabel, defaultMaxPrice, normalizeText } from "./constants";

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

  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedGender, setSelectedGender] = useState(defaultGender);
  const [maxPrice, setMaxPrice] = useState(defaultMaxPrice);
  const [selectedAdTypes, setSelectedAdTypes] = useState<string[]>([]);
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]);
  const [selectedHairs, setSelectedHairs] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const normalizedLocationQuery = locationInput.toLowerCase().trim();
  const locationMatches = normalizedLocationQuery.length < 2 ? [] : cities.filter((city) => city.toLowerCase().includes(normalizedLocationQuery));

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

  const openLocationToolsModal = () => {
    setLocationInput(selectedCity === "all" ? "Sao Paulo" : selectedCity);
    setShowLocationToolsModal(true);
  };

  const clearLocation = () => {
    setLocationInput("");
    setSelectedCity("all");
  };

  const useAutomaticLocation = () => {
    setSelectedCity("Sao Paulo");
    setLocationInput("Sao Paulo");
    setShowLocationToast(true);
    setTimeout(() => setShowLocationToast(false), 3000);
  };

  return (
    <AppShell location={selectedLocation}>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden min-w-70 shrink-0 flex-col lg:flex">
            <div className="sticky top-24 flex max-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 p-5">
                <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900">
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
                <button onClick={clearFilters} className="text-xs font-bold uppercase tracking-wider text-wine-700 hover:underline">Limpar</button>
              </div>

              <div className="custom-scrollbar flex-1 overflow-y-auto bg-white p-5">
                <FeedFiltersContent
                  selectedLocation={selectedLocation}
                  activeQuickFilters={activeQuickFilters}
                  selectedGender={selectedGender}
                  maxPrice={maxPrice}
                  selectedAdTypes={selectedAdTypes}
                  selectedEthnicities={selectedEthnicities}
                  selectedHairs={selectedHairs}
                  selectedServices={selectedServices}
                  onToggleQuickFilter={toggleQuickFilter}
                  onSelectGender={setSelectedGender}
                  onSetMaxPrice={setMaxPrice}
                  onToggleAdTypeFilter={toggleAdTypeFilter}
                  onToggleSelection={(field, value) => {
                    if (field === "ethnicities") toggleSelection(setSelectedEthnicities, value);
                    if (field === "hairs") toggleSelection(setSelectedHairs, value);
                    if (field === "services") toggleSelection(setSelectedServices, value);
                  }}
                  onOpenLocationToolsModal={openLocationToolsModal}
                />
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-zinc-900">Acompanhantes</h1>
                <p className="mt-1 text-sm text-zinc-500">{filteredAds.length} perfis encontrados</p>
              </div>

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
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="mx-auto h-120 w-full max-w-[320px] lg:max-w-none" />)}
              </div>
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
        <FeedFiltersContent
          selectedLocation={selectedLocation}
          activeQuickFilters={activeQuickFilters}
          selectedGender={selectedGender}
          maxPrice={maxPrice}
          selectedAdTypes={selectedAdTypes}
          selectedEthnicities={selectedEthnicities}
          selectedHairs={selectedHairs}
          selectedServices={selectedServices}
          onToggleQuickFilter={toggleQuickFilter}
          onSelectGender={setSelectedGender}
          onSetMaxPrice={setMaxPrice}
          onToggleAdTypeFilter={toggleAdTypeFilter}
          onToggleSelection={(field, value) => {
            if (field === "ethnicities") toggleSelection(setSelectedEthnicities, value);
            if (field === "hairs") toggleSelection(setSelectedHairs, value);
            if (field === "services") toggleSelection(setSelectedServices, value);
          }}
          onOpenLocationToolsModal={openLocationToolsModal}
        />
      </Modal>

      <FeedLocationModal
        open={showLocationToolsModal}
        onClose={() => setShowLocationToolsModal(false)}
        locationInput={locationInput}
        locationMatches={locationMatches}
        showSuccessToast={showLocationToast}
        onLocationInputChange={setLocationInput}
        onSelectLocation={applySelectedLocation}
        onAutomaticLocation={useAutomaticLocation}
        onClearLocation={clearLocation}
      />
    </AppShell>
  );
}
