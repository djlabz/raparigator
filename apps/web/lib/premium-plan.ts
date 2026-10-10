"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { PlanLimits, PlanTier, PremiumState } from "@sigillus/contracts";
import { getPlanLimits } from "@sigillus/domain";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";

export {
  PREMIUM_PHOTO_LIMIT,
  PREMIUM_VIDEO_LIMIT,
  PREMIUM_VISIBILITY_MULTIPLIER,
  STANDARD_PHOTO_LIMIT,
  STANDARD_VIDEO_LIMIT,
} from "@sigillus/domain";

const PLAN_STORAGE_KEY = "sigillus-premium-plan";
const VIEW_ONCE_COUNT_KEY = "sigillus-view-once-count";

export const PREMIUM_UPLOAD_ERROR_MESSAGE = "Houve um erro ao fazer o upload";

const listeners = new Set<() => void>();

let cachedApiState: PremiumState | null = null;
let apiFetchPromise: Promise<PremiumState | null> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function isPlanTier(value: string | null): value is PlanTier {
  return value === "standard" || value === "premium";
}

function readStoredPlan(): PlanTier {
  if (typeof window === "undefined") {
    return "standard";
  }

  const stored = window.localStorage.getItem(PLAN_STORAGE_KEY);
  return isPlanTier(stored) ? stored : "standard";
}

function readViewOnceCount(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = Number(window.localStorage.getItem(VIEW_ONCE_COUNT_KEY));
  return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
}

export async function fetchPremiumState(): Promise<PremiumState | null> {
  if (!isApiDataSource()) {
    return null;
  }

  try {
    const client = getApiClient();
    const state = await client.premium.getState();
    cachedApiState = state;
    emitChange();
    return state;
  } catch {
    cachedApiState = null;
    emitChange();
    return null;
  }
}

const STANDARD_LIMITS = getPlanLimits("standard");
const PREMIUM_LIMITS = getPlanLimits("premium");

export function getCachedPlanTier(): PlanTier {
  if (isApiDataSource()) {
    return cachedApiState ? cachedApiState.plan : "standard";
  }
  return readStoredPlan();
}

export function getCachedPremiumLimits(): PlanLimits {
  if (isApiDataSource()) {
    return cachedApiState ? cachedApiState.limits : STANDARD_LIMITS;
  }
  const plan = readStoredPlan();
  return plan === "premium" ? PREMIUM_LIMITS : STANDARD_LIMITS;
}

export function getCachedCheckoutEnabled(): boolean {
  if (isApiDataSource()) {
    return cachedApiState ? cachedApiState.checkoutEnabled : false;
  }
  return false;
}

export function activatePremium() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PLAN_STORAGE_KEY, "premium");
  }

  if (isApiDataSource()) {
    cachedApiState = {
      plan: "premium",
      limits: PREMIUM_LIMITS,
      subscription: cachedApiState?.subscription ?? null,
      checkoutEnabled: cachedApiState?.checkoutEnabled ?? false,
    };
  }

  emitChange();
}

export function deactivatePremium() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PLAN_STORAGE_KEY, "standard");
  }

  if (isApiDataSource()) {
    cachedApiState = {
      plan: "standard",
      limits: STANDARD_LIMITS,
      subscription: null,
      checkoutEnabled: cachedApiState?.checkoutEnabled ?? false,
    };
  }

  emitChange();
}

export function resetCachedPremiumState() {
  cachedApiState = null;
  apiFetchPromise = null;
  emitChange();
}

export function registerViewOnceSend() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VIEW_ONCE_COUNT_KEY, String(readViewOnceCount() + 1));
  }

  emitChange();
}

export function usePremiumPlan() {
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
  const viewOnceUsed = useSyncExternalStore<number>(subscribe, readViewOnceCount, () => 0);

  useEffect(() => {
    if (isApiDataSource() && !cachedApiState && !apiFetchPromise) {
      apiFetchPromise = fetchPremiumState().finally(() => {
        apiFetchPromise = null;
      });
    }
  }, []);

  const isPremium = plan === "premium";

  return {
    plan,
    isPremium,
    checkoutEnabled,
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
    refetch: fetchPremiumState,
  };
}
