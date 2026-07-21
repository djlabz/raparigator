"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  publishFeedHeaderTitleFlags,
  useFeedHeaderTitleMotion,
  type FeedHeaderTitleFlags,
  type FeedHeaderTitleMode,
} from "./feed-header-title-context";

const LG_QUERY = "(min-width: 1024px)";
const PUSH_DISTANCE_DESKTOP_PX = 260;
const PUSH_DISTANCE_MOBILE_PX = 200;
const REVEAL_DISTANCE_PX = 96;
const IN_PAGE_TITLE_HEIGHT = 40;
const REVEAL_LAMBDA = 16;
const PUSH_LAMBDA = 14;
const SPACER_LAMBDA = 18;
const SNAP_EPS = 0.0005;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(value: number) {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function dampExp(current: number, target: number, lambda: number, dt: number) {
  const next = target + (current - target) * Math.exp(-lambda * dt);
  return Math.abs(target - next) < SNAP_EPS ? target : next;
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
  const isTabActive = useIsTabActive();
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

  useLayoutEffect(() => {
    publishFeedHeaderTitleFlags({
      enabled: hasPremium || hasStandard,
      mode: isDesktop ? "desktop" : "mobile",
      hasPremium,
      hasStandard,
    });

    if (!isTabActive) {
      motion.headerReveal.set(0);
      motion.titleFlightReady.set(0);
      motion.inPageTitleOpacity.set(1);
      motion.inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT);
      motion.pushProgress.set(0);
      motion.standardDividerOpacity.set(hasStandard ? 1 : 0);
    }
  }, [hasPremium, hasStandard, isDesktop, isTabActive, motion]);

  useEffect(() => {
    if (!isTabActive) {
      return;
    }

    const {
      pushProgress,
      headerReveal,
      inPageTitleOpacity,
      inPageTitleMaxHeight,
      standardDividerOpacity,
      titleFlightX,
      titleFlightY,
      titleFlightW,
      titleFlightReady,
    } = motion;

    const target = {
      push: 0,
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
      divider: 1,
    };

    const current = {
      push: 0,
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
      divider: 1,
    };

    let frame = 0;
    let running = true;
    let seeded = false;
    let lastTime = performance.now();

    const sampleTargets = () => {
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
          const end = headerBottom - PUSH_DISTANCE_DESKTOP_PX;
          push = smootherstep(progressAcrossBand(top, start, end));
        }
      } else {
        const revealTarget = hasPremium
          ? mobileHeadingRef.current
          : mobileHeadingRef.current ?? standardSectionRef.current;

        if (revealTarget) {
          const top = revealTarget.getBoundingClientRect().top;
          const start = headerBottom + 8;
          const end = headerBottom - REVEAL_DISTANCE_PX;
          reveal = window.scrollY < 2 ? 0 : smootherstep(progressAcrossBand(top, start, end));
        }

        if (canPush && standardSectionRef.current) {
          const top = standardSectionRef.current.getBoundingClientRect().top;
          const start = headerBottom;
          const end = headerBottom - PUSH_DISTANCE_MOBILE_PX;
          push = smootherstep(progressAcrossBand(top, start, end));
        }
      }

      target.push = push;
      target.reveal = reveal;

      if (mode === "desktop") {
        target.spacer = 0;
        target.divider = canPush ? clamp01(1 - push / 0.18) : hasStandard ? 0 : 1;
      } else {
        target.spacer = target.reveal < 0.9
          ? IN_PAGE_TITLE_HEIGHT
          : IN_PAGE_TITLE_HEIGHT * clamp01(1 - (target.reveal - 0.9) / 0.1);
        target.divider = !hasPremium && hasStandard
          ? 0
          : canPush
            ? clamp01(1 - push / 0.22)
            : hasStandard
              ? 1
              : 0;
      }
    };

    const writeFlightFromReveal = (reveal: number) => {
      const mode: FeedHeaderTitleMode = isDesktop ? "desktop" : "mobile";

      if (mode === "desktop" || (!hasPremium && !hasStandard)) {
        titleFlightReady.set(0);
        return;
      }

      const source = document.querySelector<HTMLElement>("[data-feed-title-source]");
      const dest = document.querySelector<HTMLElement>("[data-feed-title-target]");

      if (!source || !dest) {
        titleFlightReady.set(0);
        return;
      }

      const src = source.getBoundingClientRect();
      const dst = dest.getBoundingClientRect();
      if (src.width <= 0 && dst.width <= 0) {
        titleFlightReady.set(0);
        return;
      }

      const t = reveal;
      const fromW = src.width > 0 ? src.width : dst.width;
      const toW = dst.width > 0 ? dst.width : src.width;

      titleFlightX.set(src.left + (dst.left - src.left) * t);
      titleFlightY.set(src.top + (dst.top - src.top) * t);
      titleFlightW.set(fromW + (toW - fromW) * t);
      titleFlightReady.set(1);
    };

    const tick = (now: number) => {
      if (!running) {
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      sampleTargets();

      if (!seeded) {
        current.push = target.push;
        current.reveal = target.reveal;
        current.spacer = target.spacer;
        current.divider = target.divider;
        seeded = true;
      } else {
        current.push = dampExp(current.push, target.push, PUSH_LAMBDA, dt);
        current.reveal = dampExp(current.reveal, target.reveal, REVEAL_LAMBDA, dt);
        current.spacer = dampExp(current.spacer, target.spacer, SPACER_LAMBDA, dt);
        current.divider = dampExp(current.divider, target.divider, PUSH_LAMBDA, dt);
      }

      pushProgress.set(current.push);
      headerReveal.set(current.reveal);
      inPageTitleOpacity.set(clamp01(1 - current.reveal / 0.12));
      inPageTitleMaxHeight.set(current.spacer);
      standardDividerOpacity.set(current.divider);
      writeFlightFromReveal(current.reveal);

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [
    hasPremium,
    hasStandard,
    isDesktop,
    isTabActive,
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
