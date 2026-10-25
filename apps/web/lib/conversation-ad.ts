"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdBySlug, getCachedAd } from "@/lib/ad-data";
import type { Conversation, ProfessionalAd } from "@/lib/types";

export type ConversationAdResult = {
  ad: ProfessionalAd | null;
  error: string | null;
  retry: () => void;
};

export function getConversationAd(conversation: Conversation | null): ProfessionalAd | null {
  if (!conversation || !conversation.adSlug) {
    return null;
  }
  return getCachedAd(conversation.adSlug);
}

export function useConversationAd(conversation: Conversation | null): ConversationAdResult {
  const adSlug = conversation?.adSlug ?? null;
  const [state, setState] = useState<{
    slug: string | null;
    ad: ProfessionalAd | null;
    error: string | null;
  }>(() => ({ slug: adSlug, ad: getConversationAd(conversation), error: null }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!adSlug) {
      setState({ slug: null, ad: null, error: null });
      return;
    }
    const cached = getCachedAd(adSlug);
    if (cached) {
      setState({ slug: adSlug, ad: cached, error: null });
      return;
    }
    let cancelled = false;
    fetchAdBySlug(adSlug).then((result) => {
      if (!cancelled) {
        setState({ slug: adSlug, ad: result.ad, error: result.error });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [adSlug, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  if (state.slug !== adSlug) {
    return { ad: getConversationAd(conversation), error: null, retry };
  }
  return { ad: state.ad, error: state.error, retry };
}
