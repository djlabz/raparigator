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
const REVEAL_DISTANCE_PX = 72;
const IN_PAGE_TITLE_HEIGHT = 40;
const SMOOTH = 0.16;
const SNAP_EPS = 0.0008;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(value: number) {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function damp(current: number, target: number, amount: number) {
  const next = current + (target - current) * amount;
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

function roundPx(value: number) {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.round(value * dpr) / dpr;
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
      x: 0,
      y: 0,
      w: 0,
      ready: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
      divider: 1,
    };

    const current = {
      push: 0,
      reveal: 0,
      x: 0,
      y: 0,
      w: 0,
      ready: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
      divider: 1,
    };

    let frame = 0;
    let running = true;
    let seeded = false;

    const sample = () => {
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
          const start = headerBottom + 4;
          const end = headerBottom - REVEAL_DISTANCE_PX;
          reveal = window.scrollY < 4 ? 0 : smootherstep(progressAcrossBand(top, start, end));
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
        target.ready = 0;
        target.divider = canPush ? clamp01(1 - push / 0.12) : hasStandard ? 0 : 1;
      } else {
        target.spacer = reveal < 0.97 ? IN_PAGE_TITLE_HEIGHT : 0;
        target.divider = !hasPremium && hasStandard
          ? 0
          : canPush
            ? clamp01(1 - push / 0.16)
            : hasStandard
              ? 1
              : 0;

        const source = document.querySelector<HTMLElement>("[data-feed-title-source]");
        const dest = document.querySelector<HTMLElement>("[data-feed-title-target]");

        if (source && dest && (hasPremium || hasStandard)) {
          const src = source.getBoundingClientRect();
          const dst = dest.getBoundingClientRect();
          const t = reveal;
          target.x = roundPx(src.left + (dst.left - src.left) * t);
          target.y = roundPx(src.top + (dst.top - src.top) * t);
          target.w = roundPx(dst.width > 0 ? dst.width : src.width);
          target.ready = src.width > 0 || dst.width > 0 ? 1 : 0;
        } else {
          target.ready = 0;
        }
      }
    };

    const tick = () => {
      if (!running) {
        return;
      }

      sample();

      if (!seeded) {
        current.push = target.push;
        current.reveal = target.reveal;
        current.x = target.x;
        current.y = target.y;
        current.w = target.w;
        current.ready = target.ready;
        current.spacer = target.spacer;
        current.divider = target.divider;
        seeded = true;
      } else {
        current.push = damp(current.push, target.push, SMOOTH);
        current.reveal = damp(current.reveal, target.reveal, SMOOTH);
        current.x = damp(current.x, target.x, SMOOTH);
        current.y = damp(current.y, target.y, SMOOTH);
        current.w = damp(current.w, target.w, SMOOTH);
        current.ready = damp(current.ready, target.ready, 0.35);
        current.spacer = damp(current.spacer, target.spacer, 0.28);
        current.divider = damp(current.divider, target.divider, SMOOTH);
      }

      pushProgress.set(current.push);
      headerReveal.set(current.reveal);
      inPageTitleOpacity.set(0);
      inPageTitleMaxHeight.set(current.spacer);
      standardDividerOpacity.set(current.divider);
      titleFlightX.set(current.x);
      titleFlightY.set(current.y);
      titleFlightW.set(current.w);
      titleFlightReady.set(current.ready);

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
