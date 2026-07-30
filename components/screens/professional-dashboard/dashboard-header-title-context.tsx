"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { motionValue, type MotionValue } from "motion/react";

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

type FlagsStore = {
  flags: DashboardHeaderTitleFlags;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => DashboardHeaderTitleFlags;
  setFlags: (flags: DashboardHeaderTitleFlags) => void;
};

function createFlagsStore(): FlagsStore {
  const listeners = new Set<() => void>();
  const store: FlagsStore = {
    flags: defaultFlags,
    listeners,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => store.flags,
    setFlags: (next) => {
      const prev = store.flags;
      if (prev.enabled === next.enabled && prev.mode === next.mode) {
        return;
      }
      store.flags = next;
      listeners.forEach((listener) => listener());
    },
  };
  return store;
}

const globalStoreKey = "__raparigatorDashboardHeaderFlagsStore";
const globalMotionKey = "__raparigatorDashboardHeaderMotion_v1";

function getFlagsStore(): FlagsStore {
  const scope = globalThis as typeof globalThis & Record<string, FlagsStore | undefined>;
  if (!scope[globalStoreKey]) {
    scope[globalStoreKey] = createFlagsStore();
  }
  return scope[globalStoreKey]!;
}

export function publishDashboardHeaderTitleFlags(flags: DashboardHeaderTitleFlags) {
  getFlagsStore().setFlags(flags);
}

function getMotionBundle(): DashboardHeaderTitleMotion {
  const scope = globalThis as typeof globalThis & Record<string, DashboardHeaderTitleMotion | undefined>;
  if (!scope[globalMotionKey]) {
    scope[globalMotionKey] = createMotionBundle();
  }
  return scope[globalMotionKey]!;
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
