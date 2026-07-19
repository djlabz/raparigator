"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  publishFeedHeaderTitleFlags,
  useFeedHeaderTitleMotion,
  type FeedHeaderTitleFlags,
  type FeedHeaderTitleMode,
} from "./feed-header-title-context";

const LG_QUERY = "(min-width: 1024px)";
const PUSH_DISTANCE_PX = 140;
const REVEAL_DISTANCE_PX = 56;
const IN_PAGE_TITLE_HEIGHT = 56;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function readIsDesktop() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia(LG_QUERY).matches;
}

function headerOffsetPx() {
  if (typeof window === "undefined") {
    return 80;
  }

  return window.matchMedia("(min-width: 768px)").matches ? 80 : 64;
}

function progressAcrossBand(edge: number, start: number, end: number) {
  if (start === end) {
    return edge <= end ? 1 : 0;
  }

  return clamp01((start - edge) / (start - end));
}

interface UseFeedSectionTitleScrollArgs {
  hasPremium: boolean;
  hasStandard: boolean;
  mobileHeadingRef: RefObject<HTMLDivElement | null>;
  premiumSectionRef: RefObject<HTMLDivElement | null>;
  standardSectionRef: RefObject<HTMLDivElement | null>;
}

export function useFeedSectionTitleScroll({
  hasPremium,
  hasStandard,
  mobileHeadingRef,
  premiumSectionRef,
  standardSectionRef,
}: UseFeedSectionTitleScrollArgs): FeedHeaderTitleFlags {
  const motion = useFeedHeaderTitleMotion();
  const [isDesktop, setIsDesktop] = useState(readIsDesktop);

  useEffect(() => {
    const desktopMq = window.matchMedia(LG_QUERY);

    const sync = () => {
      setIsDesktop(desktopMq.matches);
    };

    sync();
    desktopMq.addEventListener("change", sync);
    return () => desktopMq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    publishFeedHeaderTitleFlags({
      enabled: hasPremium || hasStandard,
      mode: isDesktop ? "desktop" : "mobile",
      hasPremium,
      hasStandard,
    });
  }, [hasPremium, hasStandard, isDesktop]);

  useEffect(() => {
    const {
      pushProgress,
      headerReveal,
      inPageTitleOpacity,
      inPageTitleMaxHeight,
      standardDividerOpacity,
    } = motion;

    let frame = 0;

    const measure = () => {
      const headerBottom = headerOffsetPx();
      const canPush = hasPremium && hasStandard;
      const mode: FeedHeaderTitleMode = isDesktop ? "desktop" : "mobile";

      let reveal = 0;
      let push = 0;

      if (!hasPremium && !hasStandard) {
        reveal = 0;
        push = 0;
      } else if (mode === "desktop") {
        reveal = 1;

        if (canPush && standardSectionRef.current) {
          const top = standardSectionRef.current.getBoundingClientRect().top;
          const start = headerBottom;
          const end = headerBottom - PUSH_DISTANCE_PX;
          push = progressAcrossBand(top, start, end);
        } else {
          push = 0;
        }
      } else {
        const revealTarget = hasPremium
          ? mobileHeadingRef.current
          : mobileHeadingRef.current ?? standardSectionRef.current;

        if (revealTarget) {
          const top = revealTarget.getBoundingClientRect().top;
          const start = headerBottom + 4;
          const end = headerBottom - REVEAL_DISTANCE_PX;
          reveal = window.scrollY < 4 ? 0 : progressAcrossBand(top, start, end);
        }

        if (canPush && standardSectionRef.current) {
          const top = standardSectionRef.current.getBoundingClientRect().top;
          const start = headerBottom;
          const end = headerBottom - PUSH_DISTANCE_PX;
          push = progressAcrossBand(top, start, end);
        } else {
          push = 0;
        }
      }

      pushProgress.set(push);
      headerReveal.set(reveal);

      if (mode === "desktop") {
        inPageTitleOpacity.set(0);
        inPageTitleMaxHeight.set(0);
        standardDividerOpacity.set(canPush ? 1 - push : hasStandard ? 0 : 1);
      } else {
        const inPageOpacity = 1 - reveal;
        inPageTitleOpacity.set(inPageOpacity);
        inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT * inPageOpacity);

        if (!hasPremium && hasStandard) {
          standardDividerOpacity.set(0);
        } else if (canPush) {
          standardDividerOpacity.set(1 - push);
        } else {
          standardDividerOpacity.set(hasStandard ? 1 : 0);
        }
      }

    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [
    hasPremium,
    hasStandard,
    isDesktop,
    mobileHeadingRef,
    motion,
    premiumSectionRef,
    standardSectionRef,
  ]);

  return {
    enabled: hasPremium || hasStandard,
    mode: isDesktop ? "desktop" : "mobile",
    hasPremium,
    hasStandard,
  };
}
