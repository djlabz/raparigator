"use client";

import { useSyncExternalStore } from "react";
import type { PlanTier } from "@/lib/types";

const PLAN_STORAGE_KEY = "sigillus-premium-plan";
const VIEW_ONCE_COUNT_KEY = "sigillus-view-once-count";

export const STANDARD_PHOTO_LIMIT = 10;
export const STANDARD_VIDEO_LIMIT = 3;
export const PREMIUM_PHOTO_LIMIT = 100;
export const PREMIUM_VIDEO_LIMIT = 50;
export const PREMIUM_VISIBILITY_MULTIPLIER = 1.6;
export const PREMIUM_UPLOAD_ERROR_MESSAGE = "Houve um erro ao fazer o upload";

const listeners = new Set<() => void>();

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

export function activatePremium() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PLAN_STORAGE_KEY, "premium");
  }

  emitChange();
}

export function registerViewOnceSend() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(VIEW_ONCE_COUNT_KEY, String(readViewOnceCount() + 1));
  }

  emitChange();
}

export function usePremiumPlan() {
  const plan = useSyncExternalStore<PlanTier>(subscribe, readStoredPlan, () => "standard");
  const viewOnceUsed = useSyncExternalStore<number>(subscribe, readViewOnceCount, () => 0);

  const isPremium = plan === "premium";

  return {
    plan,
    isPremium,
    activatePremium,
    viewOnceUsed,
    canSendViewOnce: isPremium,
    registerViewOnceSend,
    photoLimit: isPremium ? PREMIUM_PHOTO_LIMIT : STANDARD_PHOTO_LIMIT,
    videoLimit: isPremium ? PREMIUM_VIDEO_LIMIT : STANDARD_VIDEO_LIMIT,
  };
}
