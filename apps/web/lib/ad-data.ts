"use client";

import { useEffect, useState } from "react";
import type { FeedAdSummary, MediaHighlight, ProfessionalAd } from "@sigillus/contracts";
import { getApiClient } from "@/lib/api/client";

export type PopularAdsKind = "most_viewed" | "top_rated";

export type AsyncListResult<T> = {
  items: T[];
  isLoading: boolean;
  error: string | null;
};

export type ProfessionalAdResult = {
  ad: ProfessionalAd | undefined;
  isLoading: boolean;
  error: string | null;
};

const POPULAR_ADS_LIMIT = 50;

const adCache = new Map<string, ProfessionalAd | null>();
const viewedSlugs = new Set<string>();

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type AdState = { slug: string; ad: ProfessionalAd | null; error: string | null };

function cachedAdState(slug: string): AdState | null {
  return adCache.has(slug) ? { slug, ad: adCache.get(slug) ?? null, error: null } : null;
}

export function getCachedAd(slug: string): ProfessionalAd | null {
  return adCache.get(slug) ?? null;
}

export async function fetchAdBySlug(slug: string): Promise<ProfessionalAd | null> {
  if (adCache.has(slug)) {
    return adCache.get(slug) ?? null;
  }
  try {
    const ad = await getApiClient().ads.getBySlug({ slug });
    adCache.set(slug, ad);
    return ad;
  } catch {
    return null;
  }
}

export function useProfessionalAd(slug: string): ProfessionalAdResult {
  const [apiState, setApiState] = useState<AdState | null>(() => cachedAdState(slug));

  useEffect(() => {
    if (adCache.has(slug)) {
      return;
    }
    let cancelled = false;
    getApiClient()
      .ads.getBySlug({ slug })
      .then((ad) => {
        adCache.set(slug, ad);
        if (!cancelled) {
          setApiState({ slug, ad, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setApiState({
            slug,
            ad: null,
            error: errorMessage(error, "Não foi possível carregar o anúncio."),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const state = apiState?.slug === slug ? apiState : cachedAdState(slug);
  if (!state) {
    return { ad: undefined, isLoading: true, error: null };
  }
  return { ad: state.ad ?? undefined, isLoading: false, error: state.error };
}

export function useRegisterAdView(slug: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || viewedSlugs.has(slug)) {
      return;
    }
    viewedSlugs.add(slug);
    getApiClient()
      .ads.registerView({ slug })
      .catch(() => {
        viewedSlugs.delete(slug);
      });
  }, [enabled, slug]);
}

function useApiList<T>(
  key: string,
  load: () => Promise<T[]>,
  fallbackError: string,
): AsyncListResult<T> {
  const [apiState, setApiState] = useState<{ key: string; items: T[]; error: string | null }>({
    key: "",
    items: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((items) => {
        if (!cancelled) {
          setApiState({ key, items, error: null });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setApiState({ key, items: [], error: errorMessage(error, fallbackError) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fallbackError, key, load]);

  return {
    items: apiState.key === key ? apiState.items : [],
    isLoading: apiState.key !== key,
    error: apiState.key === key ? apiState.error : null,
  };
}

const loadMostViewed = () =>
  getApiClient().ads.listPopular({ kind: "most_viewed", limit: POPULAR_ADS_LIMIT });
const loadTopRated = () =>
  getApiClient().ads.listPopular({ kind: "top_rated", limit: POPULAR_ADS_LIMIT });
const loadMediaHighlights = () => getApiClient().ads.mediaHighlights();

export function usePopularAds(kind: PopularAdsKind): AsyncListResult<FeedAdSummary> {
  return useApiList<FeedAdSummary>(
    kind,
    kind === "most_viewed" ? loadMostViewed : loadTopRated,
    "Não foi possível carregar o ranking.",
  );
}

export function useMediaHighlights(): AsyncListResult<MediaHighlight> {
  return useApiList<MediaHighlight>(
    "media-highlights",
    loadMediaHighlights,
    "Não foi possível carregar os destaques.",
  );
}
