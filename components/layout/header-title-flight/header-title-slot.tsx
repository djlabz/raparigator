"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useFeedHeaderTitleFlags,
  useOptionalFeedHeaderTitleMotion,
} from "@/components/screens/feed-screen/feed-header-title-context";
import { FeedSectionTitle } from "@/components/screens/feed-screen/feed-section-title";
import {
  useDashboardHeaderTitleFlags,
  useOptionalDashboardHeaderTitleMotion,
} from "@/components/screens/professional-dashboard/dashboard-header-title-context";
import { cn } from "@/lib/utils";
import { TITLE_STACK_PX } from "./constants";
import { MobileLogoSwap } from "./mobile-logo-swap";

const BRAND_LOGO_CLASS =
  "inline-flex h-10 shrink-0 items-center font-display text-2xl font-medium leading-none tracking-wide text-wine-800";

function isFeedPath(pathname: string) {
  return pathname === "/feed" || pathname.startsWith("/feed/");
}

function isProfessionalDashboardPath(pathname: string) {
  return pathname === "/profissional/dashboard" || pathname.startsWith("/profissional/dashboard/");
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
      <div
        data-feed-desktop-title-stack
        className="relative mx-auto h-12 w-full max-w-lg overflow-hidden"
      >
        <motion.div
          data-feed-desktop-title="premium"
          style={{ y: premiumY, opacity: premiumOpacity }}
          className="flex h-12 w-full items-center justify-center will-change-transform"
        >
          <FeedSectionTitle variant="premium" size="lg" className="justify-center" />
        </motion.div>
        <motion.div
          data-feed-desktop-title="standard"
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

function FeedMobileTitleSwap() {
  const { enabled } = useFeedHeaderTitleFlags();
  const motionValues = useOptionalFeedHeaderTitleMotion();
  const fallbackReveal = useMotionValue(0);
  const headerReveal = motionValues?.headerReveal ?? fallbackReveal;

  return (
    <MobileLogoSwap
      enabled={enabled}
      headerReveal={headerReveal}
      targetAttr="data-feed-title-target"
      fallback={<BrandLogoLink />}
      logo={<BrandLogoLink />}
    />
  );
}

function DashboardMobileTitleSwap() {
  const { enabled } = useDashboardHeaderTitleFlags();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackReveal = useMotionValue(0);
  const headerReveal = motionValues?.headerReveal ?? fallbackReveal;

  return (
    <MobileLogoSwap
      enabled={enabled}
      headerReveal={headerReveal}
      targetAttr="data-dashboard-title-target"
      fallback={<BrandLogoLink />}
      logo={<BrandLogoLink />}
    />
  );
}

export function HeaderTitleSlot() {
  const pathname = usePathname();
  const feed = useFeedHeaderTitleFlags();
  const dashboard = useDashboardHeaderTitleFlags();

  if (isFeedPath(pathname) && feed.enabled) {
    if (feed.mode === "mobile") {
      return <FeedMobileTitleSwap />;
    }
    return <BrandLogoLink className="relative z-10" />;
  }

  if (isProfessionalDashboardPath(pathname) && dashboard.enabled) {
    if (dashboard.mode === "mobile") {
      return <DashboardMobileTitleSwap />;
    }
    return <BrandLogoLink />;
  }

  return <BrandLogoLink />;
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
