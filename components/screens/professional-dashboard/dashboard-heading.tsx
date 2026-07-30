"use client";

import type { RefObject } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { useIsTabActive } from "@/components/layout/tab-activity";
import {
  useDashboardHeaderTitleFlags,
  useOptionalDashboardHeaderTitleMotion,
} from "./dashboard-header-title-context";
import { DASHBOARD_HEADER_TITLE } from "./dashboard-title";

interface DashboardHeadingProps {
  headingRef: RefObject<HTMLDivElement | null>;
}

export function DashboardHeading({ headingRef }: DashboardHeadingProps) {
  const isTabActive = useIsTabActive();
  const { enabled, mode } = useDashboardHeaderTitleFlags();
  const motionValues = useOptionalDashboardHeaderTitleMotion();
  const fallbackMaxHeight = useMotionValue(40);
  const fallbackReady = useMotionValue(0);
  const inPageTitleMaxHeight = motionValues?.inPageTitleMaxHeight ?? fallbackMaxHeight;
  const titleFlightReady = motionValues?.titleFlightReady ?? fallbackReady;
  const restTitleOpacity = useTransform(titleFlightReady, (value) => (value > 0.5 ? 0 : 1));

  const mobileFlight = enabled && mode === "mobile";

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
        Painel profissional
      </p>

      {mobileFlight ? (
        <div ref={headingRef} className="relative min-w-0 lg:hidden">
          {isTabActive ? (
            <>
              <motion.div
                style={{ height: inPageTitleMaxHeight }}
                className="overflow-hidden"
                aria-hidden
              />
              <div
                data-dashboard-title-source
                className="pointer-events-none invisible absolute inset-x-0 top-0 flex h-10 w-full items-center"
                aria-hidden
              >
                <span className="truncate text-2xl font-semibold leading-none tracking-tight text-zinc-900">
                  {DASHBOARD_HEADER_TITLE}
                </span>
              </div>
              <motion.div
                style={{ opacity: restTitleOpacity }}
                className="pointer-events-none absolute inset-x-0 top-0 flex h-10 w-full items-center"
              >
                <h1 className="truncate text-2xl font-semibold leading-none tracking-tight text-zinc-900">
                  {DASHBOARD_HEADER_TITLE}
                </h1>
              </motion.div>
            </>
          ) : (
            <div className="flex h-10 w-full items-center">
              <h1 className="truncate text-2xl font-semibold leading-none tracking-tight text-zinc-900">
                {DASHBOARD_HEADER_TITLE}
              </h1>
            </div>
          )}
        </div>
      ) : (
        <div ref={headingRef} className="hidden" aria-hidden />
      )}

      <h1 className={mobileFlight ? "hidden text-2xl font-semibold text-zinc-900 lg:block lg:text-3xl" : "text-2xl font-semibold text-zinc-900 lg:text-3xl"}>
        Seu dashboard
      </h1>
    </div>
  );
}
