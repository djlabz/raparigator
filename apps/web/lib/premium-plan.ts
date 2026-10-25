"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { PlanLimits, PlanTier, PremiumState } from "@sigillus/contracts";
import { getPlanLimits } from "@sigillus/domain";
import { getApiClient } from "@/lib/api/client";
import { authClient } from "@/lib/api/auth-client";
import { reportStoreError, type StoreErrorKind } from "@/lib/report-store-error";

const VIEW_ONCE_COUNT_KEY = "sigillus-view-once-count";
const PROFESSIONAL_ROLE = "profissional";

export const PREMIUM_UPLOAD_ERROR_MESSAGE = "Houve um erro ao fazer o upload";

const listeners = new Set<() => void>();

let cachedApiState: PremiumState | null = null;
let lastError: StoreErrorKind | null = null;
let fetchedForUserId: string | null = null;
let pendingUserId: string | null = null;
let generation = 0;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function readViewOnceCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = Number(window.localStorage.getItem(VIEW_ONCE_COUNT_KEY));
  return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
}

async function fetchPremiumState(userId: string | null): Promise<PremiumState | null> {
  generation += 1;
  const started = generation;
  pendingUserId = userId;
  try {
    const state = await getApiClient().premium.getState();
    if (started !== generation) {
      return cachedApiState;
    }
    cachedApiState = state;
    lastError = null;
    return state;
  } catch (error) {
    if (started !== generation) {
      return cachedApiState;
    }
    lastError = reportStoreError("premium.getState", error);
    return cachedApiState;
  } finally {
    if (started === generation) {
      fetchedForUserId = userId;
      pendingUserId = null;
      emitChange();
    }
  }
}

export function resetPremiumPlan() {
  generation += 1;
  cachedApiState = null;
  lastError = null;
  fetchedForUserId = null;
  pendingUserId = null;
  emitChange();
}

const STANDARD_LIMITS = getPlanLimits("standard");
const PREMIUM_LIMITS = getPlanLimits("premium");

function getCachedPlanTier(): PlanTier {
  return cachedApiState ? cachedApiState.plan : "standard";
}

function getCachedPremiumLimits(): PlanLimits {
  return cachedApiState ? cachedApiState.limits : STANDARD_LIMITS;
}

function getCachedCheckoutEnabled(): boolean {
  return cachedApiState ? cachedApiState.checkoutEnabled : false;
}

function getLastError(): StoreErrorKind | null {
  return lastError;
}

function activatePremium() {
  cachedApiState = {
    plan: "premium",
    limits: PREMIUM_LIMITS,
    subscription: cachedApiState?.subscription ?? null,
    checkoutEnabled: cachedApiState?.checkoutEnabled ?? false,
  };

  emitChange();
}

function deactivatePremium() {
  cachedApiState = {
    plan: "standard",
    limits: STANDARD_LIMITS,
    subscription: null,
    checkoutEnabled: cachedApiState?.checkoutEnabled ?? false,
  };

  emitChange();
}

function registerViewOnceSend() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VIEW_ONCE_COUNT_KEY, String(readViewOnceCount() + 1));
  }

  emitChange();
}

export function usePremiumPlan() {
  const session = authClient.useSession();
  const sessionUser = session.data?.user as { id: string; role?: unknown } | undefined;
  const userId = sessionUser?.id ?? null;
  const isProfessional = sessionUser?.role === PROFESSIONAL_ROLE;

  const plan = useSyncExternalStore<PlanTier>(subscribe, getCachedPlanTier, () => "standard");
  const limits = useSyncExternalStore<PlanLimits>(
    subscribe,
    getCachedPremiumLimits,
    () => STANDARD_LIMITS,
  );
  const checkoutEnabled = useSyncExternalStore<boolean>(
    subscribe,
    getCachedCheckoutEnabled,
    () => false,
  );
  const error = useSyncExternalStore<StoreErrorKind | null>(subscribe, getLastError, () => null);
  const viewOnceUsed = useSyncExternalStore<number>(subscribe, readViewOnceCount, () => 0);

  useEffect(() => {
    if (!userId || !isProfessional) {
      if (cachedApiState || lastError || fetchedForUserId) {
        resetPremiumPlan();
      }
      return;
    }
    if (fetchedForUserId === userId || pendingUserId === userId) {
      return;
    }
    void fetchPremiumState(userId);
  }, [isProfessional, userId]);

  const isPremium = plan === "premium";

  return {
    plan,
    isPremium,
    checkoutEnabled,
    lastError: error,
    subscription: cachedApiState?.subscription ?? null,
    activatePremium,
    deactivatePremium,
    viewOnceUsed,
    canSendViewOnce: limits.canSendViewOnce,
    registerViewOnceSend,
    photoLimit: limits.photoLimit,
    videoLimit: limits.videoLimit,
    visibilityMultiplier: limits.visibilityMultiplier,
    canUseAlias: limits.canUseAlias,
    limits,
    refetch: () => fetchPremiumState(userId),
  };
}
