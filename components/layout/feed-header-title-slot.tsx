"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "@/components/screens/feed-screen/feed-header-title-context";
import { FeedSectionTitle } from "@/components/screens/feed-screen/feed-section-title";

const TITLE_STACK_PX = 28;

function isFeedPath(pathname: string) {
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

function DesktopTitleStack() {
  const { hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackPush = useMotionValue(0);
  const pushProgress = motionValues?.pushProgress ?? fallbackPush;

  const premiumY = useTransform(pushProgress, (value) => -value * TITLE_STACK_PX);
  const standardY = useTransform(pushProgress, (value) => (1 - value) * TITLE_STACK_PX);
  const premiumOpacity = useTransform(pushProgress, [0, 0.42, 0.58], [1, 1, 0]);
  const standardOpacity = useTransform(pushProgress, [0.42, 0.58, 1], [0, 1, 1]);

  if (hasPremium && hasStandard) {
    return (
      <div className="relative mx-auto h-12 w-full max-w-lg overflow-hidden">
        <motion.div
          style={{ y: premiumY, opacity: premiumOpacity }}
          className="flex h-12 w-full items-center justify-center will-change-transform"
        >
          <FeedSectionTitle variant="premium" size="lg" className="justify-center" />
        </motion.div>
        <motion.div
          style={{ y: standardY, opacity: standardOpacity }}
          className="absolute inset-0 flex h-12 w-full items-center justify-center will-change-transform"
        >
          <FeedSectionTitle variant="standard" size="lg" className="justify-center" />
        </motion.div>
      </div>
    );
  }

  if (hasPremium) {
    return (
      <div className="flex h-12 w-full max-w-lg items-center justify-center">
        <FeedSectionTitle variant="premium" size="lg" className="justify-center" />
      </div>
    );
  }

  if (hasStandard) {
    return (
      <div className="flex h-12 w-full max-w-lg items-center justify-center">
        <FeedSectionTitle variant="standard" size="lg" className="justify-center" />
      </div>
    );
  }

  return null;
}

function MobileTitleSwap() {
  const { enabled } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackReveal = useMotionValue(0);
  const headerReveal = motionValues?.headerReveal ?? fallbackReveal;

  const logoOpacity = useTransform(headerReveal, [0, 0.45, 1], [1, 0.35, 0]);
  const logoY = useTransform(headerReveal, [0, 1], [0, -8]);

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
    <div className="relative min-w-0 flex-1">
      <div className="relative flex h-11 min-w-0 w-full items-center overflow-hidden">
        <motion.div style={{ opacity: logoOpacity, y: logoY }} className="flex shrink-0 items-center">
          <Link
            href="/"
            className="font-display text-xl tracking-wide text-wine-800 opacity-100"
          >
            Sigillus
          </Link>
        </motion.div>

        <div
          data-feed-title-target
          className="pointer-events-none absolute inset-y-0 left-0 right-0 h-11 min-w-0"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function FeedHeaderTitleSlot() {
  const pathname = usePathname();
  const { enabled, mode } = useFeedHeaderTitleFlags();
  const onFeed = isFeedPath(pathname);

  if (!onFeed || !enabled) {
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
  const pathname = usePathname();
  const { enabled, mode } = useFeedHeaderTitleFlags();

  if (!isFeedPath(pathname) || !enabled || mode !== "desktop") {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-32">
      <DesktopTitleStack />
    </div>
  );
}
