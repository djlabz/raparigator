"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "@/components/screens/feed-screen/feed-header-title-context";
import { FeedSectionTitle } from "@/components/screens/feed-screen/feed-section-title";
import { cn } from "@/lib/utils";

const TITLE_STACK_PX = 28;
const BRAND_LOGO_CLASS =
  "inline-flex h-10 shrink-0 items-center font-display text-2xl font-medium leading-none tracking-wide text-wine-800";

function isFeedPath(pathname: string) {
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

function BrandLogoLink({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn(BRAND_LOGO_CLASS, className)}>
      Sigillus
    </Link>
  );
}

function DesktopTitleStack() {
  const { hasPremium, hasStandard } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackPush = useMotionValue(0);
  const pushProgress = motionValues?.pushProgress ?? fallbackPush;

  const premiumY = useTransform(pushProgress, (value) => -value * TITLE_STACK_PX);
  const standardY = useTransform(pushProgress, (value) => (1 - value) * TITLE_STACK_PX);
  const premiumOpacity = useTransform(pushProgress, [0, 0.35, 0.65], [1, 1, 0]);
  const standardOpacity = useTransform(pushProgress, [0.35, 0.65, 1], [0, 1, 1]);

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

  const logoOpacity = useTransform(headerReveal, [0, 0.16, 0.34], [1, 1, 0]);
  const logoY = useTransform(headerReveal, [0, 0.16, 0.34], [0, 0, -TITLE_STACK_PX]);
  const logoPointerEvents = useTransform(headerReveal, (value) =>
    value > 0.3 ? "none" : "auto"
  );

  if (!enabled) {
    return <BrandLogoLink />;
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div className="relative flex h-10 min-w-0 w-full items-center overflow-hidden">
        <motion.div
          style={{ opacity: logoOpacity, y: logoY, pointerEvents: logoPointerEvents }}
          className="relative z-10 flex h-10 shrink-0 items-center will-change-transform"
        >
          <BrandLogoLink />
        </motion.div>

        <div
          data-feed-title-target
          className="pointer-events-none absolute inset-y-0 left-2 right-2 h-10 min-w-0"
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
    return <BrandLogoLink />;
  }

  if (mode === "mobile") {
    return <MobileTitleSwap />;
  }

  return <BrandLogoLink className="relative z-10" />;
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
