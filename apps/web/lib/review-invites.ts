"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { pushNotification, removeNotification } from "@/lib/account-notifications";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";
import type { InviteStatus, ReviewInvite, SubmittedReview } from "@sigillus/contracts";
import { REVIEW_INVITE_TTL_MS, getInviteStatus } from "@sigillus/domain";

export type { InviteStatus, ReviewInvite, SubmittedReview };
export { getInviteDaysLeft, getInviteStatus, hasTwoWayConversation } from "@sigillus/domain";

const STORAGE_KEY = "sigillus-review-invites";

interface ReviewInvitesState {
  invites: ReviewInvite[];
  reviews: SubmittedReview[];
}

const EMPTY_STATE: ReviewInvitesState = { invites: [], reviews: [] };

const listeners = new Set<() => void>();

let cachedMockState: ReviewInvitesState | null = null;
let apiState: ReviewInvitesState = { invites: [], reviews: [] };
let apiInitialLoaded = false;
const inFlightInvites = new Set<string>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isInvite(value: unknown): value is ReviewInvite {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ReviewInvite>;
  return (
    typeof candidate.conversationId === "string" &&
    typeof candidate.adSlug === "string" &&
    typeof candidate.invitedAt === "string" &&
    typeof candidate.expiresAt === "string"
  );
}

function isSubmittedReview(value: unknown): value is SubmittedReview {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<SubmittedReview>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.adSlug === "string" &&
    typeof candidate.conversationId === "string" &&
    typeof candidate.author === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.createdAt === "string"
  );
}

function readMockState(): ReviewInvitesState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return EMPTY_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ReviewInvitesState>;
    return {
      invites: Array.isArray(parsed.invites) ? parsed.invites.filter(isInvite) : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews.filter(isSubmittedReview) : [],
    };
  } catch {
    return EMPTY_STATE;
  }
}

function getSnapshot(): ReviewInvitesState {
  if (isApiDataSource()) {
    return apiState;
  }

  if (!cachedMockState) {
    cachedMockState = readMockState();
  }

  return cachedMockState;
}

function getServerSnapshot(): ReviewInvitesState {
  return EMPTY_STATE;
}

function writeMockState(next: ReviewInvitesState) {
  cachedMockState = next;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  emitChange();
}

function writeApiState(next: ReviewInvitesState) {
  apiState = next;
  emitChange();
}

function findInvite(state: ReviewInvitesState, conversationId: string) {
  return state.invites.find((invite) => invite.conversationId === conversationId);
}

export function inviteToReview(conversationId: string, adSlug: string): boolean {
  if (!isApiDataSource()) {
    const state = getSnapshot();
    const existing = findInvite(state, conversationId);

    if (existing?.usedAt) {
      return false;
    }

    const now = Date.now();
    const invite: ReviewInvite = {
      conversationId,
      adSlug,
      invitedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + REVIEW_INVITE_TTL_MS).toISOString(),
      usedAt: null,
    };

    writeMockState({
      ...state,
      invites: [...state.invites.filter((item) => item.conversationId !== conversationId), invite],
    });

    return true;
  }

  const existing = findInvite(apiState, conversationId);
  if (existing?.usedAt) {
    return false;
  }

  const now = Date.now();
  const optimisticInvite: ReviewInvite = {
    conversationId,
    adSlug,
    invitedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + REVIEW_INVITE_TTL_MS).toISOString(),
    usedAt: null,
  };

  writeApiState({
    ...apiState,
    invites: [
      ...apiState.invites.filter((item) => item.conversationId !== conversationId),
      optimisticInvite,
    ],
  });

  getApiClient()
    .reviews.invite({ conversationId })
    .then(({ invite }) => {
      writeApiState({
        ...apiState,
        invites: [
          ...apiState.invites.filter((item) => item.conversationId !== conversationId),
          invite,
        ],
      });
    })
    .catch(() => {
      writeApiState({
        ...apiState,
        invites: apiState.invites.filter((item) => item.conversationId !== conversationId),
      });
    });

  return true;
}

export function cancelInvite(conversationId: string): boolean {
  if (!isApiDataSource()) {
    const state = getSnapshot();
    const existing = findInvite(state, conversationId);

    if (!existing || existing.usedAt) {
      return false;
    }

    writeMockState({
      ...state,
      invites: state.invites.filter((invite) => invite.conversationId !== conversationId),
    });

    return true;
  }

  const existing = findInvite(apiState, conversationId);
  if (!existing || existing.usedAt) {
    return false;
  }

  writeApiState({
    ...apiState,
    invites: apiState.invites.filter((invite) => invite.conversationId !== conversationId),
  });

  getApiClient()
    .reviews.withdrawInvite({ conversationId })
    .catch(() => {
      writeApiState({
        ...apiState,
        invites: [...apiState.invites, existing],
      });
    });

  return true;
}

export async function submitReview(input: {
  conversationId: string;
  adSlug: string;
  author: string;
  score: number;
  comment: string;
}): Promise<boolean> {
  if (!isApiDataSource()) {
    const state = getSnapshot();
    const invite = findInvite(state, input.conversationId);

    if (getInviteStatus(invite) !== "open" || !invite) {
      return false;
    }

    const now = new Date().toISOString();
    const review: SubmittedReview = {
      id: `local-${input.conversationId}-${Date.parse(now)}`,
      adSlug: input.adSlug,
      conversationId: input.conversationId,
      author: input.author,
      score: input.score,
      comment: input.comment.trim(),
      createdAt: now,
    };

    writeMockState({
      invites: state.invites.map((item) =>
        item.conversationId === input.conversationId ? { ...item, usedAt: now } : item,
      ),
      reviews: [...state.reviews, review],
    });

    return true;
  }

  try {
    const { reviewId } = await getApiClient().reviews.submit({
      conversationId: input.conversationId,
      score: input.score,
      comment: input.comment.trim(),
    });

    const now = new Date().toISOString();
    const review: SubmittedReview = {
      id: reviewId,
      adSlug: input.adSlug,
      conversationId: input.conversationId,
      author: input.author,
      score: input.score,
      comment: input.comment.trim(),
      createdAt: now,
    };

    writeApiState({
      invites: apiState.invites.map((item) =>
        item.conversationId === input.conversationId ? { ...item, usedAt: now } : item,
      ),
      reviews: [...apiState.reviews, review],
    });

    return true;
  } catch {
    return false;
  }
}

function inviteNotificationId(conversationId: string) {
  return `review-invite-${conversationId}`;
}

export function sendReviewInvite(input: {
  conversationId: string;
  adSlug: string;
  professionalName: string;
}): boolean {
  if (!inviteToReview(input.conversationId, input.adSlug)) {
    return false;
  }

  if (!isApiDataSource()) {
    pushNotification("cliente", {
      id: inviteNotificationId(input.conversationId),
      title: "Avaliação disponível",
      message: `${input.professionalName} liberou uma avaliação do perfil. Conte como foi o contato.`,
      time: "Agora",
      href: `/anuncio/${input.adSlug}?avaliar=${input.conversationId}`,
    });
  }

  return true;
}

export function withdrawReviewInvite(conversationId: string): boolean {
  if (!cancelInvite(conversationId)) {
    return false;
  }

  if (!isApiDataSource()) {
    removeNotification("cliente", inviteNotificationId(conversationId));
  }

  return true;
}

export function useReviewInvites() {
  const useApi = isApiDataSource();
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!useApi || apiInitialLoaded) {
      return;
    }
    let cancelled = false;
    getApiClient()
      .reviews.listMyInvites()
      .then((invites) => {
        if (!cancelled) {
          apiInitialLoaded = true;
          const merged = new Map<string, ReviewInvite>();
          for (const item of invites) {
            merged.set(item.conversationId, item);
          }
          for (const item of apiState.invites) {
            if (!merged.has(item.conversationId)) {
              merged.set(item.conversationId, item);
            }
          }
          writeApiState({
            ...apiState,
            invites: Array.from(merged.values()),
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [useApi]);

  const getInvite = useMemo(() => {
    return (conversationId: string) => {
      const found = findInvite(state, conversationId);
      if (found) {
        return found;
      }
      if (useApi && conversationId && !inFlightInvites.has(conversationId)) {
        inFlightInvites.add(conversationId);
        getApiClient()
          .reviews.getInvite({ conversationId })
          .then((res) => {
            if (res.invite) {
              writeApiState({
                ...apiState,
                invites: [
                  ...apiState.invites.filter((item) => item.conversationId !== conversationId),
                  res.invite,
                ],
              });
            }
          })
          .catch(() => {})
          .finally(() => {
            inFlightInvites.delete(conversationId);
          });
      }
      return undefined;
    };
  }, [state, useApi]);

  return useMemo(
    () => ({
      invites: state.invites,
      reviews: state.reviews,
      getInvite,
      getInviteForAd: (adSlug: string) => state.invites.find((invite) => invite.adSlug === adSlug),
      getReviewsForAd: (adSlug: string) =>
        state.reviews.filter((review) => review.adSlug === adSlug),
    }),
    [state, getInvite],
  );
}
