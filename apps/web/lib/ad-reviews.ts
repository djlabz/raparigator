"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiClient } from "@/lib/api/client";
import { useReviewInvites } from "@/lib/review-invites";
import type { AdReviewsSummary, ProfessionalAd, Review } from "@sigillus/contracts";
import { mergeRating } from "@sigillus/domain";

export type { AdReviewsSummary };

const adReviewsCache = new Map<string, AdReviewsSummary>();

export function useAdReviews(ad: ProfessionalAd | undefined): AdReviewsSummary {
  const { getReviewsForAd } = useReviewInvites();
  const slug = ad?.slug ?? "";
  const [apiSummary, setApiSummary] = useState<AdReviewsSummary | null>(() =>
    slug ? (adReviewsCache.get(slug) ?? null) : null,
  );

  useEffect(() => {
    if (!slug) {
      return;
    }
    let cancelled = false;
    getApiClient()
      .reviews.listForAd({ slug })
      .then((summary) => {
        adReviewsCache.set(slug, summary);
        if (!cancelled) {
          setApiSummary(summary);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return useMemo(() => {
    if (!ad) {
      return { reviews: [], rating: 0, reviewsCount: 0 };
    }

    const base = apiSummary ?? {
      reviews: [],
      rating: ad.rating,
      reviewsCount: ad.reviewsCount,
    };
    const submitted = getReviewsForAd(ad.slug);
    const existingIds = new Set(base.reviews.map((r) => r.id));
    const newlySubmitted = submitted.filter((r) => !existingIds.has(r.id));
    if (newlySubmitted.length === 0) {
      return base;
    }
    const extraReviews: Review[] = newlySubmitted.map((r) => ({
      id: r.id,
      adId: ad.id,
      author: r.author,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
    const mergedReviews = [...extraReviews, ...base.reviews];
    const recalculated = mergeRating(
      base.rating,
      base.reviewsCount,
      newlySubmitted.map((r) => r.score),
    );
    return {
      reviews: mergedReviews,
      rating: recalculated.rating,
      reviewsCount: recalculated.reviewsCount,
    };
  }, [ad, apiSummary, getReviewsForAd]);
}
