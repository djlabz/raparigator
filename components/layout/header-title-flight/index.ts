export {
  FLIGHT_SNAP_REVEAL,
  IN_PAGE_OPACITY_REVEAL_DIVISOR,
  IN_PAGE_TITLE_HEIGHT,
  LG_QUERY,
  REVEAL_LAMBDA_DESKTOP,
  REVEAL_LAMBDA_MOBILE,
  SPACER_LAMBDA,
  TITLE_STACK_PX,
} from "./constants";
export { createFlagsStore, getOrCreateGlobal, type FlagsStore } from "./flags-store";
export { FeedHeaderDesktopTitle, HeaderTitleSlot } from "./header-title-slot";
export {
  clamp01,
  dampExp,
  headerOffsetPx,
  inPageSpacerFromReveal,
  progressAcrossBand,
  readIsDesktop,
  sampleMobileTitleReveal,
  smootherstep,
} from "./math";
export { MobileLogoSwap } from "./mobile-logo-swap";
export { MobileTitleFlightPortal } from "./mobile-title-flight-portal";
export { useDampedScrollLoop } from "./use-damped-scroll-loop";
export { useMatchDesktop } from "./use-match-desktop";
export {
  writeFlightFromReveal,
  type TitleFlightMotionChannels,
} from "./write-flight";
