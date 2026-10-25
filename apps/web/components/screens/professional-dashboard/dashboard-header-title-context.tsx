"use client";

import {
  publishDashboardTitleFlightFlags,
  useDashboardTitleFlightFlags,
  useDashboardTitleFlightMotion,
} from "@/components/layout/header-title-flight/registry-facade";
import type {
  DashboardTitleFlightFlags,
  TitleFlightMode,
} from "@/components/layout/header-title-flight/surface-types";

export type DashboardHeaderTitleMode = TitleFlightMode;
export type DashboardHeaderTitleFlags = DashboardTitleFlightFlags;

export function publishDashboardHeaderTitleFlags(flags: DashboardHeaderTitleFlags) {
  publishDashboardTitleFlightFlags(flags);
}

export function useDashboardHeaderTitleFlags() {
  return useDashboardTitleFlightFlags();
}

export function useDashboardHeaderTitleMotion() {
  return useDashboardTitleFlightMotion();
}

export function useOptionalDashboardHeaderTitleMotion() {
  return useDashboardTitleFlightMotion();
}
