"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "@/components/screens/feed-screen/feed-header-title-context";
import { FeedSectionTitle } from "@/components/screens/feed-screen/feed-section-title";

const TITLE_STACK_PX = 48;

function clampFade(value: number) {
  return Math.min(1, Math.max(0, value));
}

function DesktopTitleStack() {
  const { hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackPush = useMotionValue(0);
  const pushProgress = motionValues?.pushProgress ?? fallbackPush;

  const premiumY = useTransform(pushProgress, (value) => -value * TITLE_STACK_PX);
  const standardY = useTransform(pushProgress, (value) => (1 - value) * TITLE_STACK_PX);
  const premiumOpacity = useTransform(pushProgress, [0, 0.75, 1], [1, 1, 0]);
  const standardOpacity = useTransform(pushProgress, [0, 0.25, 1], [0, 1, 1]);

  if (hasPremium && hasStandard) {
    return (
      <div className="relative mx-auto h-12 w-full max-w-lg overflow-hidden">
        <motion.div
          style={{ y: premiumY, opacity: premiumOpacity }}
          className="flex h-12 items-center justify-center"
        >
          <FeedSectionTitle variant="premium" size="lg" />
        </motion.div>
        <motion.div
          style={{ y: standardY, opacity: standardOpacity }}
          className="absolute inset-0 flex h-12 items-center justify-center"
        >
          <FeedSectionTitle variant="standard" size="lg" />
        </motion.div>
      </div>
    );
  }

  if (hasPremium) {
    return (
      <div className="flex h-12 items-center justify-center">
        <FeedSectionTitle variant="premium" size="lg" />
      </div>
    );
  }

  if (hasStandard) {
    return (
      <div className="flex h-12 items-center justify-center">
        <FeedSectionTitle variant="standard" size="lg" />
      </div>
    );
  }

  return null;
}

function MobileTitleSwap() {
  const { enabled, hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackReveal = useMotionValue(0);
  const fallbackPush = useMotionValue(0);
  const headerReveal = motionValues?.headerReveal ?? fallbackReveal;
  const pushProgress = motionValues?.pushProgress ?? fallbackPush;

  const logoOpacity = useTransform(headerReveal, [0, 0.45, 1], [1, 0.35, 0]);
  const logoY = useTransform(headerReveal, [0, 1], [0, -8]);
  const titleOpacity = useTransform(headerReveal, [0, 0.4, 1], [0, 0.9, 1]);
  const titleY = useTransform(headerReveal, [0, 1], [12, 0]);
  const titleVisibility = useTransform(headerReveal, (value) =>
    value < 0.04 ? "hidden" : "visible"
  );

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
    return value < 0.8 ? 1 : clampFade(1 - (value - 0.8) / 0.2);
  });

  const standardOpacity = useTransform(pushProgress, (value) => {
    if (!hasPremium || !hasStandard) {
      return hasStandard && !hasPremium ? 1 : 0;
    }
    return value <= 0.2 ? 0 : clampFade((value - 0.2) / 0.35);
  });

  if (!enabled) {
    return (
      <Link
        href="/"
        className="font-display text-xl tracking-wide text-wine-800 opacity-100"
      >
        Sigillus
      </Link>
    );
  }

  return (
    <div className="relative flex h-11 min-w-0 flex-1 items-center overflow-hidden">
      <motion.div style={{ opacity: logoOpacity, y: logoY }} className="flex shrink-0 items-center">
        <Link
          href="/"
          className="font-display text-xl tracking-wide text-wine-800 opacity-100"
        >
          Sigillus
        </Link>
      </motion.div>

      <motion.div
        style={{ opacity: titleOpacity, y: titleY, visibility: titleVisibility }}
        className="pointer-events-none absolute inset-y-0 left-0 right-0 flex min-w-0 items-center"
      >
        <div className="relative h-11 w-full min-w-0">
          {hasPremium ? (
            <motion.div
              style={{ y: premiumY, opacity: premiumOpacity }}
              className="flex h-11 min-w-0 items-center"
            >
              <FeedSectionTitle variant="premium" size="sm" adaptiveIcon className="w-full" />
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
                  ? "absolute inset-0 flex h-11 min-w-0 items-center"
                  : "flex h-11 min-w-0 items-center"
              }
            >
              <FeedSectionTitle variant="standard" size="sm" adaptiveIcon className="w-full" />
            </motion.div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

export function FeedHeaderTitleSlot() {
  const { enabled, mode } = useFeedHeaderTitleFlags();

  if (!enabled) {
    return (
      <Link
        href="/"
        className="font-display text-xl tracking-wide text-wine-800 opacity-100 md:text-2xl"
      >
        Sigillus
      </Link>
    );
  }

  if (mode === "mobile") {
    return <MobileTitleSwap />;
  }

  return (
    <Link
      href="/"
      className="relative z-10 shrink-0 font-display text-xl tracking-wide text-wine-800 opacity-100 md:text-2xl"
    >
      Sigillus
    </Link>
  );
}

export function FeedHeaderDesktopTitle() {
  const { enabled, mode } = useFeedHeaderTitleFlags();

  if (!enabled || mode !== "desktop") {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-32">
      <DesktopTitleStack />
    </div>
  );
}
