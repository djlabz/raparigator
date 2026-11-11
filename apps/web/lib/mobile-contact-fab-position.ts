import type { MobileContactFabSide } from "@sigillus/domain";

const SIDE_STORAGE_KEY = "sigillus-mobile-contact-fab-side-v2";
const Y_STORAGE_KEY = "sigillus-mobile-contact-fab-y-v2";

export function readMobileContactFabSide(): MobileContactFabSide {
  if (typeof window === "undefined") {
    return "left";
  }

  const stored = window.localStorage.getItem(SIDE_STORAGE_KEY);
  return stored === "right" ? "right" : "left";
}

export function saveMobileContactFabSide(side: MobileContactFabSide) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SIDE_STORAGE_KEY, side);
}

export function readMobileContactFabY(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const stored = window.localStorage.getItem(Y_STORAGE_KEY);
  if (stored === null) {
    return 0;
  }

  const parsed = Number.parseFloat(stored);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function saveMobileContactFabY(y: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(Y_STORAGE_KEY, String(y));
}
