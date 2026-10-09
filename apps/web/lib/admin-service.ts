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
import {
  ads,
  adminActivityLog,
  mockClients,
  mockReports,
  weeklySignupsData,
} from "@/lib/mock-data";
import { getApiClient } from "@/lib/api/client";
import { isApiDataSource } from "@/lib/data-source";

const profileStore: ProfessionalAd[] = ads.map((ad) => ({
  ...ad,
  verificationStatus: ad.verificationStatus ?? ("published" as VerificationStatus),
}));

const clientStore: MockClient[] = mockClients.map((c) => ({ ...c }));
const reportStore: Report[] = mockReports.map((r) => ({ ...r }));

export async function getDashboardStats(): Promise<DashboardStats> {
  if (isApiDataSource()) {
    return getApiClient().admin.dashboard();
  }

  const published = profileStore.filter(
    (p) => p.verificationStatus === "published" && !p.isSuspended,
  );
  const pending = profileStore.filter((p) => p.verificationStatus === "pending_review");
  const newThisWeek = clientStore.filter((c) => {
    const registered = new Date(c.registeredAt);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return registered >= weekAgo;
  });
  return {
    totalClients: clientStore.length,
    totalProfessionals: published.length,
    pendingReview: pending.length,
    newThisWeek: newThisWeek.length,
    weeklySignups: weeklySignupsData,
    recentActivity: adminActivityLog.slice(0, 8),
  };
}

export async function getClients(status?: "active" | "suspended"): Promise<MockClient[]> {
  if (isApiDataSource()) {
    return getApiClient().admin.clients({ status });
  }

  if (!status) return [...clientStore];
  return clientStore.filter((c) => c.status === status);
}

export async function suspendClient(id: string, adminId: string, reason: string): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().admin.suspendClient({ id, reason });
    return;
  }

  const idx = clientStore.findIndex((c) => c.id === id);
  if (idx !== -1) {
    clientStore[idx] = { ...clientStore[idx], status: "suspended", suspensionReason: reason };
  }
}

export async function reinstateClient(id: string, _adminId: string): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().admin.reinstateClient({ id });
    return;
  }

  const idx = clientStore.findIndex((c) => c.id === id);
  if (idx !== -1) {
    clientStore[idx] = { ...clientStore[idx], status: "active", suspensionReason: undefined };
  }
}

export async function getActiveProfessionals(): Promise<ProfessionalAd[]> {
  if (isApiDataSource()) {
    return getApiClient().admin.professionals({ status: "published" });
  }

  return profileStore.filter((p) => p.verificationStatus === "published");
}

export async function suspendProfessional(
  id: string,
  adminId: string,
  reason: string,
): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().admin.suspendProfessional({ id, reason });
    return;
  }

  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = { ...profileStore[idx], isSuspended: true, rejectionReason: reason };
  }
}

export async function reinstateProfessional(id: string, _adminId: string): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().admin.reinstateProfessional({ id });
    return;
  }

  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = { ...profileStore[idx], isSuspended: false, rejectionReason: undefined };
  }
}

export async function getAllProfiles(status?: VerificationStatus): Promise<ProfessionalAd[]> {
  if (isApiDataSource()) {
    return getApiClient().admin.professionals({ status });
  }

  if (!status) return [...profileStore];
  return profileStore.filter((p) => p.verificationStatus === status);
}

export async function getProfileById(id: string): Promise<ProfessionalAd | null> {
  if (isApiDataSource()) {
    return getApiClient().admin.profile({ id });
  }

  return profileStore.find((p) => p.id === id) ?? null;
}

export async function approveProfile(
  id: string,
  adminId: string,
  note?: string,
): Promise<AdminReviewAction> {
  if (isApiDataSource()) {
    return getApiClient().admin.approveProfile({ id, note });
  }

  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = {
      ...profileStore[idx],
      verificationStatus: "published",
      rejectionReason: undefined,
    };
  }
  return {
    profileId: id,
    action: "approved",
    adminId,
    note,
    timestamp: new Date().toISOString(),
  };
}

export async function rejectProfile(
  id: string,
  adminId: string,
  reason: string,
): Promise<AdminReviewAction> {
  if (isApiDataSource()) {
    return getApiClient().admin.rejectProfile({ id, reason });
  }

  const idx = profileStore.findIndex((p) => p.id === id);
  if (idx !== -1) {
    profileStore[idx] = {
      ...profileStore[idx],
      verificationStatus: "rejected",
      rejectionReason: reason,
    };
  }
  return {
    profileId: id,
    action: "rejected",
    adminId,
    reason,
    timestamp: new Date().toISOString(),
  };
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  if (isApiDataSource()) {
    return getApiClient().admin.reports({ status });
  }

  if (!status) return [...reportStore];
  return reportStore.filter((r) => r.status === status);
}

export async function startReview(id: string): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().admin.startReportReview({ id });
    return;
  }

  const idx = reportStore.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reportStore[idx] = {
      ...reportStore[idx],
      status: "under_review",
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function resolveReport(
  id: string,
  resolution: "resolved" | "dismissed",
  note: string,
): Promise<void> {
  if (isApiDataSource()) {
    await getApiClient().admin.resolveReport({ id, resolution, note });
    return;
  }

  const idx = reportStore.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reportStore[idx] = {
      ...reportStore[idx],
      status: resolution,
      resolution: note,
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  if (isApiDataSource()) {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }
    return getApiClient().admin.search({ q: trimmed });
  }

  if (!query.trim()) return [];
  const q = query.toLowerCase();

  const clientResults: GlobalSearchResult[] = clientStore
    .filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q),
    )
    .slice(0, 5)
    .map((c) => ({
      type: "client",
      id: c.id,
      name: c.fullName,
      subtitle: `${c.city}, ${c.state} · ${c.email.slice(0, 8)}***`,
      href: "/admin/clientes",
      status: c.status,
    }));

  const professionalResults: GlobalSearchResult[] = profileStore
    .filter(
      (p) =>
        (p.verificationStatus === "published" || p.verificationStatus === "pending_review") &&
        (p.artisticName.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)),
    )
    .slice(0, 5)
    .map((p) => ({
      type: "professional",
      id: p.id,
      name: p.artisticName,
      subtitle: `${p.category} · ${p.city}, ${p.state}`,
      href: `/admin/perfis/${p.id}`,
      status: p.verificationStatus,
    }));

  return [...clientResults, ...professionalResults];
}
