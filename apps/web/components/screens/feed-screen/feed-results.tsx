"use client";

import type { RefObject } from "react";
import type { FeedAdSummary } from "@sigillus/contracts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FeedAdCard } from "./feed-ad-card";
import { FeedSectionDivider } from "./feed-section-divider";

const SKELETON_COUNT = 6;
const CARDS_GRID_CLASS =
  "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

interface FeedResultsProps {
  isLoading: boolean;
  isEmpty: boolean;
  premiumAds: FeedAdSummary[];
  visibleStandardAds: FeedAdSummary[];
  hasMoreStandard: boolean;
  premiumSectionRef: RefObject<HTMLDivElement | null>;
  standardSectionRef: RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

export function FeedResults({
  isLoading,
  isEmpty,
  premiumAds,
  visibleStandardAds,
  hasMoreStandard,
  premiumSectionRef,
  standardSectionRef,
  onLoadMore,
  onClearFilters,
}: FeedResultsProps) {
  if (isLoading) {
    return (
      <div className={CARDS_GRID_CLASS}>
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <Skeleton key={index} className="mx-auto h-120 w-full max-w-[320px] lg:max-w-none" />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="Ops… sumiu todo mundo"
        description="Nenhum perfil combinou com esses filtros. Afrouxa um pouquinho a busca e a gente te mostra quem está no clima."
        actionLabel="Começar de novo"
        onAction={onClearFilters}
      />
    );
  }

  const hasPremium = premiumAds.length > 0;

  return (
    <>
      {hasPremium && (
        <div ref={premiumSectionRef} data-feed-premium-section className="relative z-10">
          <FeedSectionDivider variant="premium" />
          <div className={cn("relative overflow-visible", CARDS_GRID_CLASS)}>
            {premiumAds.map((ad, index) => (
              <FeedAdCard key={ad.id} ad={ad} priority={index === 0} />
            ))}
          </div>
        </div>
      )}

      {visibleStandardAds.length > 0 && (
        <div
          ref={standardSectionRef}
          data-feed-standard-section
          className={cn("relative", hasPremium && "min-h-[calc(100vh-5rem)] pb-24")}
        >
          <FeedSectionDivider variant="standard" hasPremiumSection={hasPremium} />
          <div className={CARDS_GRID_CLASS}>
            {visibleStandardAds.map((ad, index) => (
              <FeedAdCard key={ad.id} ad={ad} priority={!hasPremium && index === 0} />
            ))}
          </div>

          {hasMoreStandard ? (
            <div className="flex justify-center pt-6">
              <Button onClick={onLoadMore}>Carregar mais anúncios</Button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
