"use client";

import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useSyncExternalStore } from "react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "./feed-header-title-context";
import { FeedSectionTitle } from "./feed-section-title";

const TITLE_STACK_PX = 28;

function clampFade(value: number) {
  return Math.min(1, Math.max(0, value));
}

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

export function FeedMobileTitleFlight() {
  const isTabActive = useIsTabActive();
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);
  const { enabled, mode, hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const fallbackW = useMotionValue(0);
  const fallbackReady = useMotionValue(0);
  const fallbackPush = useMotionValue(0);

  const titleFlightX = motionValues?.titleFlightX ?? fallbackX;
  const titleFlightY = motionValues?.titleFlightY ?? fallbackY;
  const titleFlightW = motionValues?.titleFlightW ?? fallbackW;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;
  const pushProgress = motionValues?.pushProgress ?? fallbackPush;

  const opacity = useTransform(titleFlightReady, (value) => (value > 0.5 ? 1 : 0));
  const width = useTransform(titleFlightW, (value) => Math.max(0, value));

  const premiumY = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return 0;
    }
    return -value * TITLE_STACK_PX;
  });

  const standardY = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return 0;
    }
    return (1 - value) * TITLE_STACK_PX;
  });

  const premiumOpacity = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return hasPremium ? 1 : 0;
    }
    if (value <= 0.42) {
      return 1;
    }
    if (value >= 0.58) {
      return 0;
    }
    return clampFade(1 - (value - 0.42) / 0.16);
  });

  const standardOpacity = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return hasStandard && !hasPremium ? 1 : 0;
    }
    if (value <= 0.42) {
      return 0;
    }
    if (value >= 0.58) {
      return 1;
    }
    return clampFade((value - 0.42) / 0.16);
  });

  if (!mounted || !isTabActive || !enabled || mode !== "mobile") {
    return null;
  }

  return createPortal(
    <motion.div
      aria-hidden
      style={{
        x: titleFlightX,
        y: titleFlightY,
        width,
        opacity,
      }}
      className="pointer-events-none fixed top-0 left-0 z-40 overflow-hidden will-change-transform"
    >
      <div className="relative h-11 w-full min-w-0">
        {hasPremium ? (
          <motion.div
            style={{ y: premiumY, opacity: premiumOpacity }}
            className="flex h-11 w-full min-w-0 items-center will-change-transform"
          >
            <FeedSectionTitle variant="premium" fit className="w-full" />
          </motion.div>
        ) : null}
        {hasStandard ? (
          <motion.div
            style={{
              y: hasPremium ? standardY : 0,
              opacity: hasPremium ? standardOpacity : 1,
            }}
            className={
              hasPremium
                ? "absolute inset-0 flex h-11 w-full min-w-0 items-center will-change-transform"
                : "flex h-11 w-full min-w-0 items-center will-change-transform"
            }
          >
            <FeedSectionTitle variant="standard" fit className="w-full" />
          </motion.div>
        ) : null}
      </div>
    </motion.div>,
    document.body
  );
}
