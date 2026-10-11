"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { getApiClient } from "@/lib/api/client";
import type { InviteStatus, ReviewInvite, SubmittedReview } from "@sigillus/contracts";
import { REVIEW_INVITE_TTL_MS } from "@sigillus/domain";

export type { InviteStatus, ReviewInvite, SubmittedReview };
export { getInviteDaysLeft, getInviteStatus, hasTwoWayConversation } from "@sigillus/domain";

interface ReviewInvitesState {
  invites: ReviewInvite[];
  reviews: SubmittedReview[];
}

const EMPTY_STATE: ReviewInvitesState = { invites: [], reviews: [] };

const listeners = new Set<() => void>();

let apiState: ReviewInvitesState = { invites: [], reviews: [] };
let apiInitialLoaded = false;
const inFlightInvites = new Set<string>();
const inviteGenerations = new Map<string, number>();
const pendingInviteRequests = new Map<string, Promise<unknown>>();

function nextInviteGeneration(conversationId: string): number {
  const generation = (inviteGenerations.get(conversationId) ?? 0) + 1;
  inviteGenerations.set(conversationId, generation);
  return generation;
}

function isCurrentInviteGeneration(conversationId: string, generation: number): boolean {
  return inviteGenerations.get(conversationId) === generation;
}

function trackInviteRequest(conversationId: string, request: Promise<unknown>) {
  const tracked = request.catch(() => {});
  pendingInviteRequests.set(conversationId, tracked);
  void tracked.then(() => {
    if (pendingInviteRequests.get(conversationId) === tracked) {
      pendingInviteRequests.delete(conversationId);
    }
  });
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ReviewInvitesState {
  return apiState;
}

function getServerSnapshot(): ReviewInvitesState {
  return EMPTY_STATE;
}

function writeApiState(next: ReviewInvitesState) {
  apiState = next;
  emitChange();
}

function findInvite(state: ReviewInvitesState, conversationId: string) {
  return state.invites.find((invite) => invite.conversationId === conversationId);
}

export function inviteToReview(conversationId: string, adSlug: string): boolean {
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

  const generation = nextInviteGeneration(conversationId);
  const previous = pendingInviteRequests.get(conversationId) ?? Promise.resolve();
  const request = previous
    .then(() => getApiClient().reviews.invite({ conversationId }))
    .then(({ invite }) => {
      if (!isCurrentInviteGeneration(conversationId, generation)) {
        return;
      }
      writeApiState({
        ...apiState,
        invites: [
          ...apiState.invites.filter((item) => item.conversationId !== conversationId),
          invite,
        ],
      });
    })
    .catch(() => {
      if (!isCurrentInviteGeneration(conversationId, generation)) {
        return;
      }
      writeApiState({
        ...apiState,
        invites: apiState.invites.filter((item) => item.conversationId !== conversationId),
      });
    });
  trackInviteRequest(conversationId, request);

  return true;
}

export function cancelInvite(conversationId: string): boolean {
  const existing = findInvite(apiState, conversationId);
  if (!existing || existing.usedAt) {
    return false;
  }

  writeApiState({
    ...apiState,
    invites: apiState.invites.filter((invite) => invite.conversationId !== conversationId),
  });

  const generation = nextInviteGeneration(conversationId);
  const previous = pendingInviteRequests.get(conversationId) ?? Promise.resolve();
  const request = previous
    .then(() => getApiClient().reviews.withdrawInvite({ conversationId }))
    .catch(() => {
      if (!isCurrentInviteGeneration(conversationId, generation)) {
        return;
      }
      writeApiState({
        ...apiState,
        invites: [...apiState.invites, existing],
      });
    });
  trackInviteRequest(conversationId, request);

  return true;
}

export async function submitReview(input: {
  conversationId: string;
  adSlug: string;
  author: string;
  score: number;
  comment: string;
}): Promise<boolean> {
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

export function sendReviewInvite(input: {
  conversationId: string;
  adSlug: string;
  professionalName: string;
}): boolean {
  if (!inviteToReview(input.conversationId, input.adSlug)) {
    return false;
  }

  return true;
}

export function withdrawReviewInvite(conversationId: string): boolean {
  if (!cancelInvite(conversationId)) {
    return false;
  }

  return true;
}

export function useReviewInvites() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (apiInitialLoaded) {
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
  }, []);

  const getInvite = useMemo(() => {
    return (conversationId: string) => {
      const found = findInvite(state, conversationId);
      if (found) {
        return found;
      }
      if (
        conversationId &&
        !inFlightInvites.has(conversationId) &&
        !pendingInviteRequests.has(conversationId)
      ) {
        inFlightInvites.add(conversationId);
        const generation = inviteGenerations.get(conversationId) ?? 0;
        getApiClient()
          .reviews.getInvite({ conversationId })
          .then((res) => {
            if ((inviteGenerations.get(conversationId) ?? 0) !== generation) {
              return;
            }
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
  }, [state]);

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
