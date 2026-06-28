export type MobileContactFabSide = "left" | "right";

const STORAGE_KEY = "sigillus-mobile-contact-fab-side";

export function readMobileContactFabSide(): MobileContactFabSide {
  if (typeof window === "undefined") {
    return "left";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "right" ? "right" : "left";
}

export function saveMobileContactFabSide(side: MobileContactFabSide) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, side);
}

export function getMobileContactFabX(side: MobileContactFabSide, containerWidth: number, fabSize = 56) {
  return side === "right" ? containerWidth - fabSize : 0;
}

export function getMobileContactFabTooltipSide(fabSide: MobileContactFabSide): "left" | "right" {
  return fabSide === "left" ? "right" : "left";
}

export function resolveMobileContactFabSideFromX(currentX: number, containerWidth: number, fabSize = 56): MobileContactFabSide {
  const midPoint = (containerWidth - fabSize) / 2;
  return currentX > midPoint ? "right" : "left";
}
