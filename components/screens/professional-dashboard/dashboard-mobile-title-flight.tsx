"use client";

import { createPortal } from "react-dom";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useSyncExternalStore } from "react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  useDashboardHeaderTitleFlags,
  useOptionalDashboardHeaderTitleMotion,
} from "./dashboard-header-title-context";
import { DASHBOARD_HEADER_TITLE } from "./dashboard-title";

function subscribeNoop() {
  return () => {};
}

function getClientMounted() {
  return true;
}

function getServerMounted() {
  return false;
}

export function DashboardMobileTitleFlight() {
  const isTabActive = useIsTabActive();
  const mounted = useSyncExternalStore(subscribeNoop, getClientMounted, getServerMounted);
  const { enabled, mode } = useDashboardHeaderTitleFlags();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const fallbackW = useMotionValue(0);
  const fallbackReady = useMotionValue(0);

  const titleFlightX = motionValues?.titleFlightX ?? fallbackX;
  const titleFlightY = motionValues?.titleFlightY ?? fallbackY;
  const titleFlightW = motionValues?.titleFlightW ?? fallbackW;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;

  const opacity = useTransform(titleFlightReady, (value) => (value > 0.5 ? 1 : 0));
  const width = useTransform(titleFlightW, (value) => Math.max(0, value));

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
      className="pointer-events-none fixed top-0 left-0 z-40 overflow-hidden will-change-transform backface-hidden"
    >
      <div className="flex h-10 w-full min-w-0 items-center">
        <span className="truncate text-2xl font-semibold leading-none tracking-tight text-zinc-900">
          {DASHBOARD_HEADER_TITLE}
        </span>
      </div>
    </motion.div>,
    document.body
  );
}
