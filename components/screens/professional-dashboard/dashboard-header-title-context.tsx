"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { motionValue, type MotionValue } from "motion/react";
import {
  createFlagsStore,
  getOrCreateGlobal,
} from "@/components/layout/header-title-flight/flags-store";

export type DashboardHeaderTitleMode = "desktop" | "mobile";

export type DashboardHeaderTitleFlags = {
  enabled: boolean;
  mode: DashboardHeaderTitleMode;
};

export type DashboardHeaderTitleMotion = {
  headerReveal: MotionValue<number>;
  inPageTitleOpacity: MotionValue<number>;
  inPageTitleMaxHeight: MotionValue<number>;
  titleFlightX: MotionValue<number>;
  titleFlightY: MotionValue<number>;
  titleFlightW: MotionValue<number>;
  titleFlightReady: MotionValue<number>;
};

const defaultFlags: DashboardHeaderTitleFlags = {
  enabled: false,
  mode: "desktop",
};

function createMotionBundle(): DashboardHeaderTitleMotion {
  return {
    headerReveal: motionValue(0),
    inPageTitleOpacity: motionValue(1),
    inPageTitleMaxHeight: motionValue(40),
    titleFlightX: motionValue(0),
    titleFlightY: motionValue(0),
    titleFlightW: motionValue(0),
    titleFlightReady: motionValue(0),
  };
}

const globalStoreKey = "__raparigatorDashboardHeaderFlagsStore";
const globalMotionKey = "__raparigatorDashboardHeaderMotion_v1";

function getFlagsStore() {
  return getOrCreateGlobal(globalStoreKey, () =>
    createFlagsStore<DashboardHeaderTitleFlags>(
      defaultFlags,
      (prev, next) => prev.enabled === next.enabled && prev.mode === next.mode
    )
  );
}

export function publishDashboardHeaderTitleFlags(flags: DashboardHeaderTitleFlags) {
  getFlagsStore().setFlags(flags);
}

function getMotionBundle() {
  return getOrCreateGlobal(globalMotionKey, createMotionBundle);
}

const DashboardHeaderTitleMotionContext = createContext<DashboardHeaderTitleMotion | null>(null);

export function DashboardHeaderTitleRoot({ children }: { children: ReactNode }) {
  const motion = useMemo(() => getMotionBundle(), []);

  return (
    <DashboardHeaderTitleMotionContext.Provider value={motion}>
      {children}
    </DashboardHeaderTitleMotionContext.Provider>
  );
}

export function useDashboardHeaderTitleFlags() {
  const store = getFlagsStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => defaultFlags);
}

export function useDashboardHeaderTitleMotion() {
  return useContext(DashboardHeaderTitleMotionContext) ?? getMotionBundle();
}

export function useOptionalDashboardHeaderTitleMotion() {
  return useContext(DashboardHeaderTitleMotionContext) ?? getMotionBundle();
}
