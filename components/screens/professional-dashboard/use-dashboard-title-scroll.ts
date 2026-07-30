"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  publishDashboardHeaderTitleFlags,
  useDashboardHeaderTitleMotion,
  type DashboardHeaderTitleFlags,
  type DashboardHeaderTitleMode,
} from "./dashboard-header-title-context";

const LG_QUERY = "(min-width: 1024px)";
const REVEAL_START_MOBILE_PX = 108;
const REVEAL_END_MOBILE_PX = 6;
const REVEAL_SCROLL_FADE_PX = 28;
const FLIGHT_SNAP_REVEAL = 0.96;
const IN_PAGE_TITLE_HEIGHT = 40;
const REVEAL_LAMBDA_MOBILE = 4.6;
const SPACER_LAMBDA = 8;
const SNAP_EPS = 0.0005;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(value: number) {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function easeInOutCubic(value: number) {
  const x = clamp01(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
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

interface UseDashboardTitleScrollArgs {
  headingRef: RefObject<HTMLDivElement | null>;
}

export function useDashboardTitleScroll({
  headingRef,
}: UseDashboardTitleScrollArgs): DashboardHeaderTitleFlags {
  const motion = useDashboardHeaderTitleMotion();
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
    const mode: DashboardHeaderTitleMode = isDesktop ? "desktop" : "mobile";
    publishDashboardHeaderTitleFlags({
      enabled: true,
      mode,
    });

    if (!isTabActive) {
      motion.headerReveal.set(0);
      motion.titleFlightReady.set(0);
      motion.inPageTitleOpacity.set(1);
      motion.inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT);
    }

    return () => {
      publishDashboardHeaderTitleFlags({
        enabled: false,
        mode: "desktop",
      });
      motion.headerReveal.set(0);
      motion.titleFlightReady.set(0);
      motion.inPageTitleOpacity.set(1);
      motion.inPageTitleMaxHeight.set(IN_PAGE_TITLE_HEIGHT);
    };
  }, [isDesktop, isTabActive, motion]);

  useEffect(() => {
    if (!isTabActive) {
      return;
    }

    const {
      headerReveal,
      inPageTitleOpacity,
      inPageTitleMaxHeight,
      titleFlightX,
      titleFlightY,
      titleFlightW,
      titleFlightReady,
    } = motion;

    const target = {
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
    };
    const current = {
      reveal: 0,
      spacer: IN_PAGE_TITLE_HEIGHT,
    };

    let frame = 0;
    let running = true;
    let seeded = false;
    let lastTime = performance.now();

    const sampleTargets = () => {
      const headerBottom = headerOffsetPx();
      const mode: DashboardHeaderTitleMode = isDesktop ? "desktop" : "mobile";

      if (mode === "desktop") {
        target.reveal = 0;
        target.spacer = IN_PAGE_TITLE_HEIGHT;
        return;
      }

      const revealTarget = headingRef.current;
      if (!revealTarget) {
        target.reveal = 0;
        target.spacer = IN_PAGE_TITLE_HEIGHT;
        return;
      }

      const top = revealTarget.getBoundingClientRect().top;
      const start = headerBottom + REVEAL_START_MOBILE_PX;
      const end = headerBottom + REVEAL_END_MOBILE_PX;
      const band = smootherstep(progressAcrossBand(top, start, end));
      const scrollFade = smootherstep(window.scrollY / REVEAL_SCROLL_FADE_PX);
      target.reveal = band * scrollFade;
      target.spacer = target.reveal < 0.82
        ? IN_PAGE_TITLE_HEIGHT
        : IN_PAGE_TITLE_HEIGHT * clamp01(1 - (target.reveal - 0.82) / 0.18);
    };

    const writeFlightFromReveal = (reveal: number) => {
      const mode: DashboardHeaderTitleMode = isDesktop ? "desktop" : "mobile";

      if (mode === "desktop") {
        titleFlightReady.set(0);
        return;
      }

      const source = document.querySelector<HTMLElement>("[data-dashboard-title-source]");
      const dest = document.querySelector<HTMLElement>("[data-dashboard-title-target]");

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

      const fromW = src.width > 0 ? src.width : dst.width;
      const toW = dst.width > 0 ? dst.width : src.width;
      const t = easeInOutCubic(reveal);
      const ySpan = Math.max(0, src.top - dst.top);

      if (t >= FLIGHT_SNAP_REVEAL || ySpan < 1) {
        titleFlightX.set(dst.left);
        titleFlightY.set(dst.top);
        titleFlightW.set(toW);
        titleFlightReady.set(1);
        return;
      }

      titleFlightX.set(src.left + (dst.left - src.left) * t);
      titleFlightY.set(dst.top + ySpan * (1 - t));
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
        current.reveal = target.reveal;
        current.spacer = target.spacer;
        seeded = true;
      } else {
        current.reveal = dampExp(current.reveal, target.reveal, REVEAL_LAMBDA_MOBILE, dt);
        current.spacer = dampExp(current.spacer, target.spacer, SPACER_LAMBDA, dt);
      }

      headerReveal.set(current.reveal);
      inPageTitleOpacity.set(clamp01(1 - current.reveal / 0.22));
      inPageTitleMaxHeight.set(current.spacer);
      writeFlightFromReveal(current.reveal);

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [headingRef, isDesktop, isTabActive, motion]);

  return {
    enabled: true,
    mode: isDesktop ? "desktop" : "mobile",
  };
}
