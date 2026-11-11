"use client";

import { useMemo, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SiteFooter } from "@/components/layout/site-footer";
import { useCatalogs } from "@/lib/catalogs-data";
import { useFeedAds } from "@/lib/feed-data";
import { chromeBelowDesktopNavStickyMinH, chromeBelowHeaderStickyMinH } from "@/lib/chrome-styles";
import { useAuthSession } from "@/lib/auth-session";
import { getNavigationItems } from "@sigillus/domain";
import { useShellChrome } from "@/components/layout/shell-chrome";
import { cn } from "@/lib/utils";
import {
  FEED_DEFAULT_LOCATION_LABEL,
  clearFeedFilters,
  createFeedFiltersCriteria,
  isFeedPremiumSelected,
  partitionFeedAds,
  serializeFeedFiltersCriteria,
  toggleFeedAdType,
  toggleFeedQuickFilter,
  toggleFeedSelection,
  withFeedCity,
  withFeedGender,
  withFeedMaxPrice,
} from "@/lib/feed-filters";
import type {
  FeedAdTypeLabel,
  FeedFiltersCriteria,
  FeedQuickFilterLabel,
  FeedSelectionField,
} from "@/lib/feed-filters-types";
import { FeedFiltersAside } from "./feed-filters-aside";
import { FeedFiltersContent } from "./feed-filters-content";
import { FeedLocationModal } from "./feed-location-modal";
import { FeedMobileHeadingRow } from "./feed-mobile-heading-row";
import { FeedMobileTitleFlight } from "./feed-mobile-title-flight";
import { FeedResults } from "./feed-results";
import { useAppliedFiltersHint } from "./use-applied-filters-hint";
import { readFeedLocationFromUrl, useFeedLocation } from "./use-feed-location";
import { useFeedPagination } from "./use-feed-pagination";
import { useFeedSectionTitleScroll } from "./use-feed-section-title-scroll";
import { FEED_CARDS_COLUMN_OFFSET_CLASS, FEED_CONTENT_GRID_CLASS } from "./constants";

export function FeedScreen() {
  const [locationFromUrl] = useState(readFeedLocationFromUrl);
  const [showFilters, setShowFilters] = useState(false);
  const [criteria, setCriteria] = useState<FeedFiltersCriteria>(() =>
    createFeedFiltersCriteria({ selectedCity: locationFromUrl.city }),
  );

  const { cities } = useCatalogs();
  const location = useFeedLocation({
    initialLocation: locationFromUrl.location,
    selectedCity: criteria.selectedCity,
    cities,
    onSelectCity: (city) => setCriteria((current) => withFeedCity(current, city)),
  });

  const clearFilters = () => {
    setCriteria(clearFeedFilters());
  };

  const toggleQuickFilter = (filter: string) => {
    setCriteria((current) => toggleFeedQuickFilter(current, filter as FeedQuickFilterLabel));
  };

  const toggleAdTypeFilter = (type: string) => {
    setCriteria((current) => toggleFeedAdType(current, type as FeedAdTypeLabel));
  };

  const { ads: filteredAds, isLoading: isLoadingFeed } = useFeedAds(criteria);
  const { premium: premiumAds, standard: standardAds } = useMemo(
    () => partitionFeedAds(filteredAds),
    [filteredAds],
  );
  const pagination = useFeedPagination(standardAds, criteria);

  const selectedLocation =
    criteria.selectedCity === "all" ? FEED_DEFAULT_LOCATION_LABEL : `SP, ${criteria.selectedCity}`;
  const mobileHeadingRef = useRef<HTMLDivElement>(null);
  const premiumSectionRef = useRef<HTMLDivElement>(null);
  const standardSectionRef = useRef<HTMLDivElement>(null);
  useFeedSectionTitleScroll({
    hasPremium: premiumAds.length > 0,
    hasStandard: standardAds.length > 0,
    mobileHeadingRef,
    premiumSectionRef,
    standardSectionRef,
  });

  const { role } = useAuthSession();
  const { hideDesktopNav } = useShellChrome();
  const hasDesktopNav = !hideDesktopNav && getNavigationItems(role).length > 0;

  const filtersFingerprint = useMemo(() => serializeFeedFiltersCriteria(criteria), [criteria]);
  const showAppliedHint = useAppliedFiltersHint(filtersFingerprint, showFilters);

  const filtersContentProps = {
    resultCount: filteredAds.length,
    selectedLocation,
    activeQuickFilters: [
      ...(isFeedPremiumSelected(criteria) ? (["Premium"] as const) : []),
      ...criteria.quickFilters,
    ],
    selectedGender: criteria.selectedGender,
    maxPrice: criteria.maxPrice,
    selectedAdTypes: [
      ...(isFeedPremiumSelected(criteria) ? (["Premium"] as const) : []),
      ...(criteria.adTiers.includes("normal") ? (["Comum"] as const) : []),
    ],
    selectedEthnicities: criteria.ethnicities,
    selectedHairs: criteria.hairs,
    selectedServices: criteria.services,
    onToggleQuickFilter: toggleQuickFilter,
    onSelectGender: (gender: string) => setCriteria((c) => withFeedGender(c, gender)),
    onSetMaxPrice: (value: number) => setCriteria((c) => withFeedMaxPrice(c, value)),
    onToggleAdTypeFilter: toggleAdTypeFilter,
    onToggleSelection: (field: FeedSelectionField, value: string) => {
      setCriteria((c) => toggleFeedSelection(c, field, value));
    },
    onOpenLocationToolsModal: location.openLocationToolsModal,
  };

  return (
    <>
      <FeedMobileTitleFlight />
      <div className="relative space-y-6 select-none">
        <section className={FEED_CONTENT_GRID_CLASS}>
          <FeedFiltersAside
            hasDesktopNav={hasDesktopNav}
            onClear={clearFilters}
            filtersContentProps={filtersContentProps}
          />

          <div
            data-feed-content-column
            className={cn(
              "relative space-y-4",
              FEED_CARDS_COLUMN_OFFSET_CLASS,
              hasDesktopNav ? chromeBelowDesktopNavStickyMinH : chromeBelowHeaderStickyMinH,
            )}
          >
            <FeedMobileHeadingRow
              headingRef={mobileHeadingRef}
              onOpenFilters={() => setShowFilters(true)}
            />

            <FeedResults
              isLoading={pagination.loadingMore || isLoadingFeed}
              isEmpty={filteredAds.length === 0}
              premiumAds={premiumAds}
              visibleStandardAds={pagination.visibleItems}
              hasMoreStandard={pagination.hasMore}
              premiumSectionRef={premiumSectionRef}
              standardSectionRef={standardSectionRef}
              onLoadMore={pagination.loadMore}
              onClearFilters={clearFilters}
            />
          </div>
        </section>
        <SiteFooter className="mt-12 rounded-2xl" />
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
            onClick={clearFilters}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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
        open={location.showLocationToolsModal}
        onClose={location.closeLocationToolsModal}
        locationInput={location.locationInput}
        locationMatches={location.locationMatches}
        showSuccessToast={location.showLocationToast}
        onLocationInputChange={location.setLocationInput}
        onSelectLocation={location.applySelectedLocation}
        onAutomaticLocation={location.useAutomaticLocation}
        onClearLocation={location.clearLocation}
      />
    </>
  );
}
