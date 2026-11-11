export type MobileContactFabSide = "left" | "right";

export const MOBILE_CONTACT_FAB_SIZE = 56;
export const MOBILE_CONTACT_FAB_BOTTOM_OFFSET = 69;
export const MOBILE_CONTACT_FAB_EDGE_INSET = 16;
export const MOBILE_CONTACT_FAB_DRAG_THRESHOLD = 8;
export const MOBILE_CONTACT_FAB_SCROLL_THRESHOLD = 450;

function maxTravelUp(viewportHeight: number): number {
  return Math.max(
    0,
    viewportHeight -
      MOBILE_CONTACT_FAB_SIZE -
      MOBILE_CONTACT_FAB_BOTTOM_OFFSET -
      MOBILE_CONTACT_FAB_EDGE_INSET,
  );
}

export function clampMobileContactFabY(y: number, viewportHeight: number): number {
  return Math.min(0, Math.max(-maxTravelUp(viewportHeight), y));
}

export function getMobileContactFabTooltipSide(
  fabSide: MobileContactFabSide,
): MobileContactFabSide {
  return fabSide === "left" ? "right" : "left";
}

export function getMobileContactFabDragConstraints(viewportWidth: number, viewportHeight: number) {
  const maxHorizontal = Math.max(
    0,
    viewportWidth - MOBILE_CONTACT_FAB_SIZE - MOBILE_CONTACT_FAB_EDGE_INSET * 2,
  );
  return { top: -maxTravelUp(viewportHeight), bottom: 0, left: 0, right: maxHorizontal };
}
