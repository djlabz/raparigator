"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import { motionValue, type MotionValue } from "motion/react";

export type FeedHeaderTitleMode = "desktop" | "mobile";

export type FeedHeaderTitleFlags = {
  enabled: boolean;
  mode: FeedHeaderTitleMode;
  hasPremium: boolean;
  hasStandard: boolean;
};

export type FeedHeaderTitleMotion = {
  pushProgress: MotionValue<number>;
  headerReveal: MotionValue<number>;
  inPageTitleOpacity: MotionValue<number>;
  inPageTitleMaxHeight: MotionValue<number>;
  standardDividerOpacity: MotionValue<number>;
  titleFlightX: MotionValue<number>;
  titleFlightY: MotionValue<number>;
  titleFlightW: MotionValue<number>;
  titleFlightReady: MotionValue<number>;
};

export type FeedHeaderTitleState = FeedHeaderTitleFlags & FeedHeaderTitleMotion;

const defaultFlags: FeedHeaderTitleFlags = {
  enabled: false,
  mode: "desktop",
  hasPremium: false,
  hasStandard: false,
};

function createMotionBundle(): FeedHeaderTitleMotion {
  return {
    pushProgress: motionValue(0),
    headerReveal: motionValue(0),
    inPageTitleOpacity: motionValue(1),
    inPageTitleMaxHeight: motionValue(48),
    standardDividerOpacity: motionValue(1),
    titleFlightX: motionValue(0),
    titleFlightY: motionValue(0),
    titleFlightW: motionValue(0),
    titleFlightReady: motionValue(0),
  };
}

type FlagsStore = {
  flags: FeedHeaderTitleFlags;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => FeedHeaderTitleFlags;
  setFlags: (flags: FeedHeaderTitleFlags) => void;
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
      if (
        prev.enabled === next.enabled
        && prev.mode === next.mode
        && prev.hasPremium === next.hasPremium
        && prev.hasStandard === next.hasStandard
      ) {
        return;
      }
      store.flags = next;
      listeners.forEach((listener) => listener());
    },
  };
  return store;
}

const globalStoreKey = "__raparigatorFeedHeaderFlagsStore";
const globalMotionKey = "__raparigatorFeedHeaderMotion_v2";

function getFlagsStore(): FlagsStore {
  const scope = globalThis as typeof globalThis & Record<string, FlagsStore | undefined>;
  if (!scope[globalStoreKey]) {
    scope[globalStoreKey] = createFlagsStore();
  }
  return scope[globalStoreKey]!;
}

export function publishFeedHeaderTitleFlags(flags: FeedHeaderTitleFlags) {
  getFlagsStore().setFlags(flags);
}

function getMotionBundle(): FeedHeaderTitleMotion {
  const scope = globalThis as typeof globalThis & Record<string, FeedHeaderTitleMotion | undefined>;
  if (!scope[globalMotionKey]) {
    scope[globalMotionKey] = createMotionBundle();
  }
  return scope[globalMotionKey]!;
}

const FeedHeaderTitleMotionContext = createContext<FeedHeaderTitleMotion | null>(null);

export function FeedHeaderTitleRoot({ children }: { children: ReactNode }) {
  const motion = useMemo(() => getMotionBundle(), []);

  return (
    <FeedHeaderTitleMotionContext.Provider value={motion}>
      {children}
    </FeedHeaderTitleMotionContext.Provider>
  );
}

export function FeedHeaderTitleProvider({
  children,
}: {
  flags: FeedHeaderTitleFlags;
  children: ReactNode;
}) {
  return children;
}

export function useFeedHeaderTitleFlags() {
  const store = getFlagsStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => defaultFlags);
}

export function useFeedHeaderTitleMotion() {
  const motion = useContext(FeedHeaderTitleMotionContext) ?? getMotionBundle();
  return motion;
}

export function useFeedHeaderTitle(): FeedHeaderTitleState {
  const flags = useFeedHeaderTitleFlags();
  const motion = useFeedHeaderTitleMotion();
  return { ...flags, ...motion };
}

export function useOptionalFeedHeaderTitleMotion() {
  return useContext(FeedHeaderTitleMotionContext) ?? getMotionBundle();
}

export type FeedSectionRefs = {
  mobileHeadingRef: RefObject<HTMLDivElement | null>;
  premiumSectionRef: RefObject<HTMLDivElement | null>;
  standardSectionRef: RefObject<HTMLDivElement | null>;
};
