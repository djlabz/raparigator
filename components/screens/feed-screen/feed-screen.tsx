"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ads, cities } from "@/lib/mock-data";
import {
  chromeBelowDesktopNavStickyMaxH,
  chromeBelowDesktopNavStickyMinH,
  chromeBelowDesktopNavStickyTop,
  chromeBelowHeaderStickyMaxH,
  chromeBelowHeaderStickyMinH,
  chromeBelowHeaderStickyTop,
} from "@/lib/chrome-styles";
import { useAuthSession } from "@/lib/auth-session";
import { useIsTabActive } from "@/components/layout/tab-activity";
import { getNavigationItems } from "@/lib/navigation";
import { useShellChrome } from "@/components/layout/shell-chrome";
import { cn } from "@/lib/utils";
import { FeedAdCard } from "./feed-ad-card";
import { FeedSectionDivider } from "./feed-section-divider";
import { FeedFiltersContent } from "./feed-filters-content";
import { FeedLocationModal } from "./feed-location-modal";
import { FeedHeaderTitleProvider } from "./feed-header-title-context";
import { FeedMobileHeadingRow } from "./feed-mobile-heading-row";
import { FeedMobileTitleFlight } from "./feed-mobile-title-flight";
import { useFeedSectionTitleScroll } from "./use-feed-section-title-scroll";
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
  const [showAppliedHint, setShowAppliedHint] = useState(false);
  const appliedHintTimerRef = useRef<number | null>(null);
  const filtersFingerprintRef = useRef("");

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
      if (selectedAdTypes.includes("Comum")) {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleCount(6);
  }, [activeQuickFilters, maxPrice, selectedCity, selectedGender, selectedAdTypes, selectedEthnicities, selectedHairs, selectedServices]);

  const premiumAds = useMemo(() => filteredAds.filter((ad) => ad.adTier === "premium"), [filteredAds]);
  const standardAds = useMemo(() => filteredAds.filter((ad) => ad.adTier === "normal"), [filteredAds]);
  const visibleStandardAds = standardAds.slice(0, visibleCount);
  const selectedLocation = selectedCity === "all" ? defaultLocationLabel : `SP, ${selectedCity}`;
  const mobileHeadingRef = useRef<HTMLDivElement>(null);
  const premiumSectionRef = useRef<HTMLDivElement>(null);
  const standardSectionRef = useRef<HTMLDivElement>(null);
  const headerTitleFlags = useFeedSectionTitleScroll({
    hasPremium: premiumAds.length > 0,
    hasStandard: standardAds.length > 0,
    mobileHeadingRef,
    premiumSectionRef,
    standardSectionRef,
  });

  const { role } = useAuthSession();
  const isTabActive = useIsTabActive();
  const { hideDesktopNav } = useShellChrome();
  const hasDesktopNav = !hideDesktopNav && getNavigationItems(role).length > 0;
  const filtersAnchorRef = useRef<HTMLDivElement>(null);
  const filtersScrollRef = useRef<HTMLDivElement | null>(null);
  const filtersScrollTopRef = useRef(0);
  const filtersUserScrollAllowedRef = useRef(false);
  const filtersUserScrollTimerRef = useRef(0);
  const [filtersFixedBox, setFiltersFixedBox] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const anchor = filtersAnchorRef.current;
    if (!anchor) {
      return;
    }

    const sync = () => {
      const rect = anchor.getBoundingClientRect();
      setFiltersFixedBox({ left: rect.left, width: rect.width });

      // #region agent log
      const panel = document.querySelector("[data-feed-filters-panel]") as HTMLElement | null;
      const panelRect = panel?.getBoundingClientRect();
      let node: HTMLElement | null = panel;
      const transformedAncestors: Array<{ tag: string; transform: string; className: string }> = [];
      while (node) {
        const style = window.getComputedStyle(node);
        if (style.transform && style.transform !== "none") {
          transformedAncestors.push({
            tag: node.tagName.toLowerCase(),
            transform: style.transform,
            className: typeof node.className === "string" ? node.className.slice(0, 120) : "",
          });
        }
        node = node.parentElement;
      }
      const position = panel ? window.getComputedStyle(panel).position : null;
      fetch('http://127.0.0.1:7646/ingest/d82e9f74-3e06-47f8-a7a0-3b4681263fb3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'900cae'},body:JSON.stringify({sessionId:'900cae',runId:'pre-fix',hypothesisId:'A,B,C',location:'feed-screen.tsx:filters-sync',message:'filters position sync',data:{isTabActive,anchorLeft:rect.left,anchorWidth:rect.width,anchorTop:rect.top,panelLeft:panelRect?.left??null,panelWidth:panelRect?.width??null,panelTop:panelRect?.top??null,position,transformedAncestors,overlapDelta:panelRect&&rect?panelRect.left-rect.left:null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(anchor);
    window.addEventListener("resize", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [isTabActive]);

  useLayoutEffect(() => {
    if (!isTabActive) {
      return;
    }

    // #region agent log
    const probe = () => {
      const panel = document.querySelector("[data-feed-filters-panel]") as HTMLElement | null;
      const anchor = filtersAnchorRef.current;
      if (!panel || !anchor) {
        return;
      }
      const panelRect = panel.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      let node: HTMLElement | null = panel;
      let hasTransformAncestor = false;
      while (node) {
        const style = window.getComputedStyle(node);
        if (style.transform && style.transform !== "none") {
          hasTransformAncestor = true;
          break;
        }
        node = node.parentElement;
      }
      fetch('http://127.0.0.1:7646/ingest/d82e9f74-3e06-47f8-a7a0-3b4681263fb3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'900cae'},body:JSON.stringify({sessionId:'900cae',runId:'pre-fix',hypothesisId:'A,D,E',location:'feed-screen.tsx:active-probe',message:'feed active filter probe',data:{filtersFixedBox,panelLeft:panelRect.left,anchorLeft:anchorRect.left,overlapDelta:panelRect.left-anchorRect.left,hasTransformAncestor,position:window.getComputedStyle(panel).position},timestamp:Date.now()})}).catch(()=>{});
    };
    probe();
    const t1 = window.setTimeout(probe, 50);
    const t2 = window.setTimeout(probe, 220);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // #endregion
  }, [isTabActive, filtersFixedBox]);

  const setFiltersScrollNode = useCallback((node: HTMLDivElement | null) => {
    const previous = filtersScrollRef.current as
      | (HTMLDivElement & { __filtersScrollCleanup?: () => void })
      | null;
    previous?.__filtersScrollCleanup?.();
    filtersScrollRef.current = node;

    if (!node) {
      return;
    }

    const allowUserScroll = () => {
      filtersUserScrollAllowedRef.current = true;
      window.clearTimeout(filtersUserScrollTimerRef.current);
      filtersUserScrollTimerRef.current = window.setTimeout(() => {
        filtersUserScrollAllowedRef.current = false;
      }, 180);
    };

    const onScroll = () => {
      if (!filtersUserScrollAllowedRef.current) {
        if (node.scrollTop !== filtersScrollTopRef.current) {
          node.scrollTop = filtersScrollTopRef.current;
        }
        return;
      }
      filtersScrollTopRef.current = node.scrollTop;
    };

    node.addEventListener("wheel", allowUserScroll, { passive: true });
    node.addEventListener("touchstart", allowUserScroll, { passive: true });
    node.addEventListener("keydown", allowUserScroll);
    node.addEventListener("scroll", onScroll);

    (node as HTMLDivElement & { __filtersScrollCleanup?: () => void }).__filtersScrollCleanup = () => {
      window.clearTimeout(filtersUserScrollTimerRef.current);
      node.removeEventListener("wheel", allowUserScroll);
      node.removeEventListener("touchstart", allowUserScroll);
      node.removeEventListener("keydown", allowUserScroll);
      node.removeEventListener("scroll", onScroll);
    };
  }, []);

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

  const filtersFingerprint = useMemo(
    () =>
      JSON.stringify({
        activeQuickFilters,
        selectedAdTypes,
        selectedEthnicities,
        selectedHairs,
        selectedServices,
        selectedCity,
        selectedGender,
        maxPrice,
      }),
    [
      activeQuickFilters,
      selectedAdTypes,
      selectedEthnicities,
      selectedHairs,
      selectedServices,
      selectedCity,
      selectedGender,
      maxPrice,
    ]
  );

  useEffect(() => {
    if (!showFilters) {
      filtersFingerprintRef.current = filtersFingerprint;
      if (appliedHintTimerRef.current !== null) {
        window.clearTimeout(appliedHintTimerRef.current);
        appliedHintTimerRef.current = null;
      }
      const hideId = window.setTimeout(() => {
        setShowAppliedHint(false);
      }, 0);
      return () => {
        window.clearTimeout(hideId);
      };
    }

    if (!filtersFingerprintRef.current) {
      filtersFingerprintRef.current = filtersFingerprint;
      return;
    }

    if (filtersFingerprintRef.current === filtersFingerprint) {
      return;
    }

    filtersFingerprintRef.current = filtersFingerprint;

    if (appliedHintTimerRef.current !== null) {
      window.clearTimeout(appliedHintTimerRef.current);
    }

    const showId = window.setTimeout(() => {
      setShowAppliedHint(true);
      appliedHintTimerRef.current = window.setTimeout(() => {
        setShowAppliedHint(false);
        appliedHintTimerRef.current = null;
      }, 1800);
    }, 0);

    return () => {
      window.clearTimeout(showId);
      if (appliedHintTimerRef.current !== null) {
        window.clearTimeout(appliedHintTimerRef.current);
        appliedHintTimerRef.current = null;
      }
    };
  }, [filtersFingerprint, showFilters]);

  const filtersContentProps = {
    resultCount: filteredAds.length,
    selectedLocation,
    activeQuickFilters,
    selectedGender,
    maxPrice,
    selectedAdTypes,
    selectedEthnicities,
    selectedHairs,
    selectedServices,
    onToggleQuickFilter: toggleQuickFilter,
    onSelectGender: setSelectedGender,
    onSetMaxPrice: setMaxPrice,
    onToggleAdTypeFilter: toggleAdTypeFilter,
    onToggleSelection: (field: "ethnicities" | "hairs" | "services", value: string) => {
      if (field === "ethnicities") toggleSelection(setSelectedEthnicities, value);
      if (field === "hairs") toggleSelection(setSelectedHairs, value);
      if (field === "services") toggleSelection(setSelectedServices, value);
    },
    onOpenLocationToolsModal: openLocationToolsModal,
  };

  return (
    <FeedHeaderTitleProvider flags={headerTitleFlags}>
      <FeedMobileTitleFlight />
      <div className="relative space-y-6 select-none">
        <section className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
          <div
            ref={filtersAnchorRef}
            className={cn(
              "relative hidden min-w-70 lg:block",
              hasDesktopNav ? chromeBelowDesktopNavStickyMinH : chromeBelowHeaderStickyMinH
            )}
          >
            <aside
              data-feed-filters-panel
              className={cn(
                "z-10 flex h-fit w-full min-w-70 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
                "lg:fixed",
                hasDesktopNav ? chromeBelowDesktopNavStickyTop : chromeBelowHeaderStickyTop,
                hasDesktopNav ? chromeBelowDesktopNavStickyMaxH : chromeBelowHeaderStickyMaxH
              )}
              style={
                filtersFixedBox
                  ? { left: filtersFixedBox.left, width: filtersFixedBox.width }
                  : undefined
              }
            >
              <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50 p-5">
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
                <button type="button" onClick={clearFilters} className="text-xs font-bold uppercase tracking-wider text-wine-700 hover:underline">Limpar</button>
              </div>

              <div
                ref={setFiltersScrollNode}
                data-feed-filters-scroll
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain overscroll-y-contain bg-white p-5 [overflow-anchor:none]"
                onMouseDown={(event) => {
                  const target = event.target as HTMLElement | null;
                  if (target?.closest("button, input, label, a, [role='button']")) {
                    event.preventDefault();
                  }
                }}
              >
                <FeedFiltersContent {...filtersContentProps} />
              </div>
            </aside>
          </div>

          <div
            className={cn(
              "relative space-y-4",
              hasDesktopNav ? chromeBelowDesktopNavStickyMinH : chromeBelowHeaderStickyMinH
            )}
          >
            <FeedMobileHeadingRow
              headingRef={mobileHeadingRef}
              onOpenFilters={() => setShowFilters(true)}
            />

            {loadingMore ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="mx-auto h-120 w-full max-w-[320px] lg:max-w-none" />)}
              </div>
            ) : filteredAds.length === 0 ? (
              <EmptyState
                title="Ops… sumiu todo mundo"
                description="Nenhum perfil combinou com esses filtros. Afrouxa um pouquinho a busca e a gente te mostra quem está no clima."
                actionLabel="Começar de novo"
                onAction={clearFilters}
              />
            ) : (
              <>
                {premiumAds.length > 0 && (
                  <div ref={premiumSectionRef} className="relative z-10">
                    <FeedSectionDivider variant="premium" />
                    <div className="relative grid gap-4 overflow-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {premiumAds.map((ad, index) => (
                        <FeedAdCard key={ad.id} ad={ad} priority={index === 0} />
                      ))}
                    </div>
                  </div>
                )}

                {visibleStandardAds.length > 0 && (
                  <div ref={standardSectionRef} className="relative">
                    <FeedSectionDivider variant="standard" />
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {visibleStandardAds.map((ad, index) => (
                        <FeedAdCard
                          key={ad.id}
                          ad={ad}
                          priority={premiumAds.length === 0 && index === 0}
                        />
                      ))}
                    </div>

                    {visibleCount < standardAds.length ? (
                      <div className="flex justify-center pt-6">
                        <Button onClick={() => { setLoadingMore(true); setTimeout(() => { setVisibleCount((value) => value + 6); setLoadingMore(false); }, 900); }}>
                          Carregar mais anúncios
                        </Button>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title={
          <span className="block space-y-1">
            <span className="block text-lg font-semibold text-zinc-900">Filtros avançados</span>
            {showAppliedHint ? (
              <span className="block text-xs font-medium text-emerald-600">
                Alterações aplicadas
              </span>
            ) : null}
          </span>
        }
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
        <FeedFiltersContent {...filtersContentProps} />
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
    </FeedHeaderTitleProvider>
  );
}
