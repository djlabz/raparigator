"use client";

import { useEffect, useState } from "react";
import { fetchAdBySlug, getCachedAd } from "@/lib/ad-data";
import { isApiDataSource } from "@/lib/data-source";
import { ads } from "@/lib/mock-data";
import type { Conversation, ProfessionalAd } from "@/lib/types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getConversationAd(conversation: Conversation | null): ProfessionalAd | null {
  if (!conversation) {
    return null;
  }

  if (conversation.adSlug) {
    if (!isApiDataSource()) {
      return ads.find((ad) => ad.slug === conversation.adSlug) ?? null;
    }
    const cached = getCachedAd(conversation.adSlug);
    if (cached) {
      return cached;
    }
    void fetchAdBySlug(conversation.adSlug);
    return null;
  }

  if (!isApiDataSource()) {
    return (
      ads.find((ad) =>
        normalizeText(ad.artisticName).includes(normalizeText(conversation.contactName)),
      ) ?? null
    );
  }

  return null;
}

export async function fetchConversationAd(
  conversation: Conversation | null,
): Promise<ProfessionalAd | null> {
  if (!conversation) {
    return null;
  }
  if (conversation.adSlug) {
    return fetchAdBySlug(conversation.adSlug);
  }
  if (!isApiDataSource()) {
    return getConversationAd(conversation);
  }
  return null;
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
