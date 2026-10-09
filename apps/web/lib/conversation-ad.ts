"use client";

import { useEffect, useState } from "react";
import { fetchAdBySlug, getCachedAd } from "@/lib/ad-data";
import type { Conversation, ProfessionalAd } from "@/lib/types";

export function getConversationAd(conversation: Conversation | null): ProfessionalAd | null {
  if (!conversation || !conversation.adSlug) {
    return null;
  }

  const cached = getCachedAd(conversation.adSlug);
  if (cached) {
    return cached;
  }
  void fetchAdBySlug(conversation.adSlug);
  return null;
}

export async function fetchConversationAd(
  conversation: Conversation | null,
): Promise<ProfessionalAd | null> {
  if (!conversation || !conversation.adSlug) {
    return null;
  }
  return fetchAdBySlug(conversation.adSlug);
}

export function useConversationAd(conversation: Conversation | null): ProfessionalAd | null {
  const [ad, setAd] = useState<ProfessionalAd | null>(() => getConversationAd(conversation));

  useEffect(() => {
    let cancelled = false;
    if (!conversation) {
      setAd(null);
      return;
    }
    const current = getConversationAd(conversation);
    if (current) {
      setAd(current);
      return;
    }
    if (conversation.adSlug) {
      fetchAdBySlug(conversation.adSlug).then((loaded) => {
        if (!cancelled && loaded) {
          setAd(loaded);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [conversation]);

  return ad;
}
