"use client";

import { useEffect, useMemo, useState } from "react";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import { reviews as seededReviews } from "@/lib/mock-data";
import { useReviewInvites } from "@/lib/review-invites";
import type { AdReviewsSummary, ProfessionalAd, Review } from "@sigillus/contracts";
import { mergeRating } from "@sigillus/domain";

export type { AdReviewsSummary };

const adReviewsCache = new Map<string, AdReviewsSummary>();

export function useAdReviews(ad: ProfessionalAd | undefined): AdReviewsSummary {
  const useApi = isApiDataSource();
  const { getReviewsForAd } = useReviewInvites();
  const slug = ad?.slug ?? "";
  const [apiSummary, setApiSummary] = useState<AdReviewsSummary | null>(() =>
    slug ? (adReviewsCache.get(slug) ?? null) : null,
  );

  useEffect(() => {
    if (!useApi || !slug) {
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
  }, [useApi, slug]);

  return useMemo(() => {
    if (!ad) {
      return { reviews: [], rating: 0, reviewsCount: 0 };
    }

    if (useApi) {
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
    }

    const seeded = seededReviews.filter((review) => review.adId === ad.id);
    const submitted: Review[] = getReviewsForAd(ad.slug).map((review) => ({
      id: review.id,
      adId: ad.id,
      author: review.author,
      score: review.score,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    const merged = [...submitted, ...seeded];
    const reviewsCount = ad.reviewsCount + submitted.length;

    if (merged.length === 0) {
      return { reviews: merged, rating: ad.rating, reviewsCount };
    }

    const seededWeight = ad.reviewsCount;
    const seededTotal = ad.rating * seededWeight;
    const submittedTotal = submitted.reduce((total, review) => total + review.score, 0);
    const rating = reviewsCount > 0 ? (seededTotal + submittedTotal) / reviewsCount : ad.rating;

    return { reviews: merged, rating, reviewsCount };
  }, [ad, apiSummary, getReviewsForAd, useApi]);
}
