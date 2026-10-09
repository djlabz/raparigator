import type {
  AdminReviewAction,
  DashboardStats,
  GlobalSearchResult,
  MockClient,
  ProfessionalAd,
  Report,
  ReportStatus,
  VerificationStatus,
} from "@/lib/types";
import { getApiClient } from "@/lib/api/client";

export async function getDashboardStats(): Promise<DashboardStats> {
  return getApiClient().admin.dashboard();
}

export async function getActivityLog() {
  return getApiClient().admin.activity({ page: 1, pageSize: 50 });
}

export async function getClients(status?: "active" | "suspended"): Promise<MockClient[]> {
  return getApiClient().admin.clients({ status });
}

export async function suspendClient(
  id: string,
  _adminIdOrReason: string,
  maybeReason?: string,
): Promise<void> {
  const reason = maybeReason ?? _adminIdOrReason;
  await getApiClient().admin.suspendClient({ id, reason });
}

export async function reinstateClient(id: string, _adminId?: string): Promise<void> {
  await getApiClient().admin.reinstateClient({ id });
}

export async function getActiveProfessionals(): Promise<ProfessionalAd[]> {
  return getApiClient().admin.professionals({ status: "published" });
}

export async function suspendProfessional(
  id: string,
  _adminId: string,
  reason: string,
): Promise<void> {
  await getApiClient().admin.suspendProfessional({ id, reason });
}

export async function reinstateProfessional(id: string, _adminId: string): Promise<void> {
  await getApiClient().admin.reinstateProfessional({ id });
}

export async function getAllProfiles(status?: VerificationStatus): Promise<ProfessionalAd[]> {
  return getApiClient().admin.professionals({ status });
}

export async function getProfileById(id: string): Promise<ProfessionalAd | null> {
  return getApiClient().admin.profile({ id });
}

export async function approveProfile(
  id: string,
  _adminId: string,
  note?: string,
): Promise<AdminReviewAction> {
  return getApiClient().admin.approveProfile({ id, note });
}

export async function rejectProfile(
  id: string,
  _adminId: string,
  reason: string,
): Promise<AdminReviewAction> {
  return getApiClient().admin.rejectProfile({ id, reason });
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  return getApiClient().admin.reports({ status });
}

export async function startReview(id: string): Promise<void> {
  await getApiClient().admin.startReportReview({ id });
}

export async function resolveReport(
  id: string,
  resolution: "resolved" | "dismissed",
  note: string,
): Promise<void> {
  await getApiClient().admin.resolveReport({ id, resolution, note });
}

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }
  return getApiClient().admin.search({ q: trimmed });
}
