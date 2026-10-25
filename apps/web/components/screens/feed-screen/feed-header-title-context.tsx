"use client";

import {
  publishFeedTitleFlightFlags,
  useFeedTitleFlightFlags,
  useFeedTitleFlightMotion,
} from "@/components/layout/header-title-flight/registry-facade";
import type {
  FeedTitleFlightFlags,
  TitleFlightMode,
} from "@/components/layout/header-title-flight/surface-types";

export type FeedHeaderTitleMode = TitleFlightMode;
export type FeedHeaderTitleFlags = FeedTitleFlightFlags;

export function publishFeedHeaderTitleFlags(flags: FeedHeaderTitleFlags) {
  publishFeedTitleFlightFlags(flags);
}

export function useFeedHeaderTitleFlags() {
  return useFeedTitleFlightFlags();
}

export function useFeedHeaderTitleMotion() {
  return useFeedTitleFlightMotion();
}

export function useOptionalFeedHeaderTitleMotion() {
  return useFeedTitleFlightMotion();
}
