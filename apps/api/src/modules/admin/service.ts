import { and, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { isInformativeHash } from "@sigillus/domain";
import type {
  ActOnReportInput,
  AdminActivityLog,
  AdminReviewAction,
  ClientAccount,
  DashboardStats,
  GlobalSearchResult,
  PaginationInput,
  ProfessionalAd,
  Report,
  ReportContact,
  ReportEvidence,
  ReportStatus,
  ReportTargetMedia,
  VerificationStatus,
  WeeklySignup,
} from "@sigillus/contracts";
import type { Database } from "../../db/client";
import {
  adminActivityLogs,
  conversations,
  professionalProfiles,
  sessions,
  users,
} from "../../db/schema";
import { newId } from "../../lib/ids";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import { createMediaRepository } from "../media/repository";
import { computeImageHash } from "../reports/image-hash";
import { createReportsRepository, type ReportRow } from "../reports/repository";
import { toProfessionalAd, type ProfileRow } from "../profiles/mapper";
import type { ProfileRepository } from "../profiles/repository";
import type { PremiumService } from "../premium/service";

export type AdminActor = { id: string; name: string; email: string };

export type AdminNotification = { key: string; title: string; message: string; href: string };

type AdminNotify = (userId: string, notification: AdminNotification) => Promise<void>;

export type AdminServiceDeps = {
  db: Database;
  profiles: ProfileRepository;
  storage: ObjectStorage;
  logger: Logger;
  notify?: AdminNotify;
  premium?: PremiumService;
};

type ActivityRow = typeof adminActivityLogs.$inferSelect;
type UserRow = typeof users.$inferSelect;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const WEEKLY_SIGNUP_WEEKS = 7;
const SEARCH_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const PROFESSIONAL_ADS_HREF = "/profissional/anuncios";
const REMOVED_MEDIA_MESSAGE = "Mídia retirada após análise de denúncia.";

function splitCityState(value: string | null): { city: string; state: string } {
  if (!value) {
    return { city: "", state: "" };
  }
  const separator = value.lastIndexOf(",");
  if (separator === -1) {
    return { city: value.trim(), state: "" };
  }
  return {
    city: value.slice(0, separator).trim(),
    state: value.slice(separator + 1).trim(),
  };
}

function maskEmail(email: string): string {
  return `${email.slice(0, 8)}***`;
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function startOfUtcWeek(date: Date): Date {
  const day = date.getUTCDay();
  const offset = (day + 6) % 7;
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - offset);
  return start;
}

function shortDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function toActivityLog(row: ActivityRow): AdminActivityLog {
  return {
    id: row.id,
    action: row.action,
    targetName: row.targetName,
    targetId: row.targetId ?? undefined,
    adminEmail: row.adminEmail ?? undefined,
    reason: row.reason ?? undefined,
    timestamp: row.createdAt.toISOString(),
  };
}

function toReport(row: ReportRow, evidenceCount: number): Report {
  return {
    id: row.id,
    source: row.source,
    type: row.type,
    reason: row.reason ?? undefined,
    reporterName: row.reporterName ?? undefined,
    reporterRole: row.reporterRole ?? undefined,
    reportedName: row.reportedName ?? undefined,
    reportedId: row.reportedUserId ?? undefined,
    reportedRole: row.reportedRole ?? undefined,
    targetProfileId: row.targetProfileId ?? undefined,
    targetUrl: row.targetUrl ?? undefined,
    profileSlug: row.profileSlug ?? undefined,
    description: row.description,
    status: row.status,
    resolution: row.resolution ?? undefined,
    action: row.action ?? undefined,
    actionByEmail: row.actionAdminEmail ?? undefined,
    respondedAt: row.respondedAt?.toISOString(),
    hasContactEmail: Boolean(row.contactEmail),
    evidenceCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
  };
}

function reportReason(reportId: string, note: string): string {
  return note ? `Denúncia #${reportId}: ${note}` : `Denúncia #${reportId}`;
}

function profileLabel(row: ProfileRow): string {
  return row.artisticName || row.displayName || row.slug;
}

export function createAdminService(deps: AdminServiceDeps) {
  const { db, profiles, storage, logger, notify, premium } = deps;
  const reportsRepo = createReportsRepository(db);
  const media = createMediaRepository(db);

  async function logActivity(entry: {
    action: ActivityRow["action"];
    targetName: string;
    targetId?: string;
    adminEmail?: string;
    reason?: string;
  }) {
    await db.insert(adminActivityLogs).values({
      id: newId(),
      action: entry.action,
      targetName: entry.targetName,
      targetId: entry.targetId ?? null,
      adminEmail: entry.adminEmail ?? null,
      reason: entry.reason ?? null,
    });
  }

  async function invalidateUserSessions(userId: string) {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }

  async function findClient(id: string): Promise<UserRow> {
    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "cliente")))
      .limit(1);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Cliente não encontrado." });
    }
    return row;
  }

  async function requireProfile(id: string): Promise<ProfileRow> {
    const row = await profiles.findById(id);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Perfil não encontrado." });
    }
    return row;
  }

  async function requireReport(id: string): Promise<ReportRow> {
    const row = await reportsRepo.findById(id);
    if (!row) {
      throw new ORPCError("NOT_FOUND", { message: "Denúncia não encontrada." });
    }
    return row;
  }

  function requireOpenReport(row: ReportRow) {
    if (row.status === "resolved" || row.status === "dismissed") {
      throw new ORPCError("CONFLICT", { message: "Denúncia já foi encerrada." });
    }
  }

  async function requireTargetProfile(row: ReportRow): Promise<ProfileRow> {
    if (!row.targetProfileId) {
      throw new ORPCError("CONFLICT", {
        message: "A denúncia não aponta para um anúncio cadastrado.",
      });
    }
    return requireProfile(row.targetProfileId);
  }

  async function closeReport(
    row: ReportRow,
    admin: AdminActor,
    values: {
      status: "resolved" | "dismissed";
      resolution: string | null;
      action: ReportRow["action"];
      actionTargetId: string | null;
    },
  ) {
    const now = new Date();
    await reportsRepo.update(row.id, {
      ...values,
      actionAdminId: admin.id,
      actionAdminEmail: admin.email,
      respondedAt: now,
      updatedAt: now,
    });
  }

  async function blockImageHash(row: ReportRow, asset: { id: string; storageKey: string }) {
    let hash: string;
    try {
      hash = await computeImageHash(await storage.getObject(asset.storageKey));
    } catch (error) {
      logger.warn(
        { err: error, reportId: row.id, assetId: asset.id },
        "hash da mídia indisponível",
      );
      return;
    }
    if (!isInformativeHash(hash)) {
      logger.info({ reportId: row.id, assetId: asset.id }, "hash pouco informativo não gravado");
      return;
    }
    await reportsRepo.insertBlockedHash({
      id: newId(),
      hash,
      reportId: row.id,
      sourceAssetId: asset.id,
    });
  }

  async function removeMediaByReport(admin: AdminActor, row: ReportRow, input: ActOnReportInput) {
    if (!input.assetId) {
      throw new ORPCError("CONFLICT", { message: "Informe a mídia a remover." });
    }
    const profile = await requireTargetProfile(row);
    const asset = await media.findById(input.assetId);
    if (!asset || asset.profileId !== profile.id || asset.purpose === "chat") {
      throw new ORPCError("CONFLICT", { message: "A mídia não pertence ao anúncio denunciado." });
    }
    if (asset.kind === "image") {
      await blockImageHash(row, asset);
    }
    await storage.deleteObject(asset.storageKey).catch(() => undefined);
    if (asset.thumbnailKey) {
      await storage.deleteObject(asset.thumbnailKey).catch(() => undefined);
    }
    if (profile.profileImageAssetId === asset.id) {
      await profiles.update(profile.id, { profileImageAssetId: null });
    }
    await media.update(asset.id, {
      status: "rejected",
      thumbnailKey: null,
      moderationReason: REMOVED_MEDIA_MESSAGE,
      blockReason: reportReason(row.id, input.note),
      blockedByReportId: row.id,
    });
    await closeReport(row, admin, {
      status: "resolved",
      resolution: input.note || null,
      action: "remove_media",
      actionTargetId: asset.id,
    });
    await notifyProfileOwner(profile.userId, {
      key: `report-media-removed:${asset.id}`,
      title: "Mídia retirada do anúncio",
      message: "Uma mídia do seu anúncio foi retirada após análise de denúncia.",
      href: PROFESSIONAL_ADS_HREF,
    });
    logger.info(
      { adminId: admin.id, reportId: row.id, assetId: asset.id },
      "mídia removida por denúncia",
    );
  }

  async function unpublishByReport(admin: AdminActor, row: ReportRow, input: ActOnReportInput) {
    const profile = await requireTargetProfile(row);
    const reason = reportReason(row.id, input.note);
    const now = new Date();
    await profiles.update(profile.id, {
      verificationStatus: "rejected",
      rejectionReason: reason,
      reviewedAt: now,
    });
    await logActivity({
      action: "profile_rejected",
      targetName: profileLabel(profile),
      targetId: profile.id,
      adminEmail: admin.email,
      reason,
    });
    await closeReport(row, admin, {
      status: "resolved",
      resolution: input.note || null,
      action: "unpublish_profile",
      actionTargetId: profile.id,
    });
    await notifyProfileOwner(profile.userId, {
      key: `report-unpublished:${profile.id}:${now.getTime()}`,
      title: "Anúncio retirado do ar",
      message: `Seu anúncio foi retirado do ar após análise de denúncia: ${reason}`,
      href: PROFESSIONAL_ADS_HREF,
    });
    logger.info(
      { adminId: admin.id, reportId: row.id, profileId: profile.id },
      "anúncio despublicado por denúncia",
    );
  }

  async function toAds(rows: ProfileRow[]): Promise<ProfessionalAd[]> {
    const images = await profiles.imagesFor(rows);
    return rows.map((row) =>
      toProfessionalAd(row, images.get(row.id) ?? { images: row.externalImages }),
    );
  }

  async function weeklySignups(now: Date): Promise<WeeklySignup[]> {
    const currentWeek = startOfUtcWeek(now);
    const since = new Date(currentWeek.getTime() - (WEEKLY_SIGNUP_WEEKS - 1) * WEEK_MS);
    const weekKey = sql<string>`to_char(date_trunc('week', ${users.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;
    const rows = await db
      .select({ week: weekKey, role: users.role, total: count() })
      .from(users)
      .where(gte(users.createdAt, since))
      .groupBy(weekKey, users.role);
    const buckets: WeeklySignup[] = [];
    for (let index = 0; index < WEEKLY_SIGNUP_WEEKS; index += 1) {
      const start = new Date(since.getTime() + index * WEEK_MS);
      const key = start.toISOString().slice(0, 10);
      const own = rows.filter((row) => row.week === key);
      buckets.push({
        label: shortDate(start),
        clients: own.filter((row) => row.role === "cliente").reduce((s, r) => s + r.total, 0),
        professionals: own
          .filter((row) => row.role === "profissional")
          .reduce((s, r) => s + r.total, 0),
      });
    }
    return buckets;
  }

  async function notifyProfileOwner(userId: string, notification: AdminNotification) {
    if (!notify) {
      return;
    }
    try {
      await notify(userId, notification);
    } catch (error) {
      logger.warn({ err: error, userId }, "falha ao notificar profissional");
    }
  }

  return {
    async dashboard(now: Date = new Date()): Promise<DashboardStats> {
      const weekAgo = new Date(now.getTime() - WEEK_MS);
      const [[clients], [published], [pending], [recent], activity, signups] = await Promise.all([
        db.select({ total: count() }).from(users).where(eq(users.role, "cliente")),
        db
          .select({ total: count() })
          .from(professionalProfiles)
          .where(
            and(
              eq(professionalProfiles.verificationStatus, "published"),
              eq(professionalProfiles.isSuspended, false),
            ),
          ),
        db
          .select({ total: count() })
          .from(professionalProfiles)
          .where(eq(professionalProfiles.verificationStatus, "pending_review")),
        db.select({ total: count() }).from(users).where(gte(users.createdAt, weekAgo)),
        db
          .select()
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(RECENT_ACTIVITY_LIMIT),
        weeklySignups(now),
      ]);
      return {
        totalClients: clients?.total ?? 0,
        totalProfessionals: published?.total ?? 0,
        pendingReview: pending?.total ?? 0,
        newThisWeek: recent?.total ?? 0,
        weeklySignups: signups,
        recentActivity: activity.map(toActivityLog),
      };
    },

    async activity(pagination: PaginationInput) {
      const offset = (pagination.page - 1) * pagination.pageSize;
      const [rows, [total]] = await Promise.all([
        db
          .select()
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(pagination.pageSize)
          .offset(offset),
        db.select({ total: count() }).from(adminActivityLogs),
      ]);
      return {
        items: rows.map(toActivityLog),
        total: total?.total ?? 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
    },

    async clients(filter: { status?: "active" | "suspended" }): Promise<ClientAccount[]> {
      const totalContacts = sql<number>`(select count(*)::int from ${conversations} as c where c."client_user_id" = "user"."id")`;
      const where = filter.status
        ? and(eq(users.role, "cliente"), eq(users.status, filter.status))
        : eq(users.role, "cliente");
      const rows = await db
        .select({ user: users, totalContacts })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt));
      return rows.map(({ user, totalContacts: contacts }) => {
        const { city, state } = splitCityState(user.city);
        return {
          id: user.id,
          fullName: user.name,
          email: user.email,
          cpf: user.cpf ?? "",
          city,
          state,
          registeredAt: user.createdAt.toISOString(),
          status: user.status,
          suspensionReason: user.suspensionReason ?? undefined,
          totalContacts: Number(contacts),
        };
      });
    },

    async suspendClient(admin: AdminActor, input: { id: string; reason: string }) {
      const user = await findClient(input.id);
      await db
        .update(users)
        .set({ status: "suspended", suspensionReason: input.reason, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      await invalidateUserSessions(user.id);
      await logActivity({
        action: "account_suspended",
        targetName: user.name,
        targetId: user.id,
        adminEmail: admin.email,
        reason: input.reason,
      });
      logger.info({ adminId: admin.id, userId: user.id }, "cliente suspenso");
      return { ok: true as const };
    },

    async reinstateClient(admin: AdminActor, input: { id: string }) {
      const user = await findClient(input.id);
      await db
        .update(users)
        .set({ status: "active", suspensionReason: null, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      await logActivity({
        action: "account_reinstated",
        targetName: user.name,
        targetId: user.id,
        adminEmail: admin.email,
      });
      logger.info({ adminId: admin.id, userId: user.id }, "cliente reativado");
      return { ok: true as const };
    },

    async professionals(filter: { status?: VerificationStatus }): Promise<ProfessionalAd[]> {
      const rows = await profiles.listByStatus(filter.status);
      return toAds(rows);
    },

    async profile(input: { id: string }): Promise<ProfessionalAd | null> {
      const row = await profiles.findById(input.id);
      if (!row) {
        return null;
      }
      const [ad] = await toAds([row]);
      return ad ?? null;
    },

    async approveProfile(
      admin: AdminActor,
      input: { id: string; note?: string },
    ): Promise<AdminReviewAction> {
      const row = await requireProfile(input.id);
      const now = new Date();
      await profiles.update(row.id, {
        verificationStatus: "published",
        rejectionReason: null,
        reviewedAt: now,
      });
      await logActivity({
        action: "profile_approved",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: input.note,
      });
      await notifyProfileOwner(row.userId, {
        key: `profile-approved:${row.id}:${now.getTime()}`,
        title: "Anúncio aprovado",
        message: "Seu anúncio foi aprovado e já está publicado.",
        href: PROFESSIONAL_ADS_HREF,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "perfil aprovado");
      return {
        profileId: row.id,
        action: "approved",
        adminId: admin.id,
        note: input.note,
        timestamp: now.toISOString(),
      };
    },

    async rejectProfile(
      admin: AdminActor,
      input: { id: string; reason: string },
    ): Promise<AdminReviewAction> {
      const row = await requireProfile(input.id);
      const now = new Date();
      await profiles.update(row.id, {
        verificationStatus: "rejected",
        rejectionReason: input.reason,
        reviewedAt: now,
      });
      await logActivity({
        action: "profile_rejected",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: input.reason,
      });
      await notifyProfileOwner(row.userId, {
        key: `profile-rejected:${row.id}:${now.getTime()}`,
        title: "Anúncio precisa de ajustes",
        message: `Seu anúncio não foi aprovado: ${input.reason}`,
        href: PROFESSIONAL_ADS_HREF,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "perfil rejeitado");
      return {
        profileId: row.id,
        action: "rejected",
        adminId: admin.id,
        reason: input.reason,
        timestamp: now.toISOString(),
      };
    },

    async suspendProfessional(admin: AdminActor, input: { id: string; reason: string }) {
      const row = await requireProfile(input.id);
      await profiles.update(row.id, { isSuspended: true, suspensionReason: input.reason });
      await invalidateUserSessions(row.userId);
      await logActivity({
        action: "account_suspended",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: input.reason,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "profissional suspensa");
      return { ok: true as const };
    },

    async reinstateProfessional(admin: AdminActor, input: { id: string }) {
      const row = await requireProfile(input.id);
      await profiles.update(row.id, { isSuspended: false, suspensionReason: null });
      await logActivity({
        action: "account_reinstated",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
      });
      logger.info({ adminId: admin.id, profileId: row.id }, "profissional reativada");
      return { ok: true as const };
    },

    async reports(filter: { status?: ReportStatus }): Promise<Report[]> {
      const rows = await reportsRepo.list(filter.status);
      const counts = await reportsRepo.countEvidence(rows.map((row) => row.id));
      return rows.map((row) => toReport(row, counts.get(row.id) ?? 0));
    },

    async reportEvidence(input: { id: string }): Promise<ReportEvidence[]> {
      const row = await requireReport(input.id);
      const files = await reportsRepo.listEvidence(row.id);
      return Promise.all(
        files.map(async (file) => ({
          id: file.id,
          contentType: file.contentType,
          sizeBytes: file.sizeBytes,
          url: await storage.presignView(file.storageKey),
          createdAt: file.createdAt.toISOString(),
        })),
      );
    },

    async reportContact(admin: AdminActor, input: { id: string }): Promise<ReportContact> {
      const row = await requireReport(input.id);
      logger.info({ adminId: admin.id, reportId: row.id }, "contato da denúncia visualizado");
      return { contactEmail: row.contactEmail ?? null };
    },

    async reportTargetMedia(input: { id: string }): Promise<ReportTargetMedia[]> {
      const row = await requireReport(input.id);
      if (!row.targetProfileId) {
        return [];
      }
      const profile = await profiles.findById(row.targetProfileId);
      if (!profile) {
        return [];
      }
      const assets = await media.listByOwner(profile.userId);
      const visible = assets.filter(
        (asset) =>
          asset.profileId === profile.id && asset.purpose !== "chat" && asset.status === "ready",
      );
      return Promise.all(
        visible.map(async (asset) => ({
          id: asset.id,
          kind: asset.kind,
          status: asset.status,
          contentType: asset.contentType,
          url: await storage.presignView(asset.storageKey),
          isProfileImage: profile.profileImageAssetId === asset.id,
          createdAt: asset.createdAt.toISOString(),
        })),
      );
    },

    async actOnReport(admin: AdminActor, input: ActOnReportInput) {
      const row = await requireReport(input.id);
      requireOpenReport(row);
      if (input.action === "remove_media") {
        await removeMediaByReport(admin, row, input);
      } else if (input.action === "unpublish_profile") {
        await unpublishByReport(admin, row, input);
      } else {
        await closeReport(row, admin, {
          status: "dismissed",
          resolution: input.note || null,
          action: "dismiss",
          actionTargetId: null,
        });
        logger.info({ adminId: admin.id, reportId: row.id }, "denúncia encerrada sem ação");
      }
      return { ok: true as const };
    },

    async startReportReview(input: { id: string }) {
      const row = await requireReport(input.id);
      if (row.status !== "pending") {
        throw new ORPCError("CONFLICT", { message: "Denúncia já está em análise ou encerrada." });
      }
      await reportsRepo.update(row.id, { status: "under_review", updatedAt: new Date() });
      return { ok: true as const };
    },

    async resolveReport(
      admin: AdminActor,
      input: { id: string; resolution: "resolved" | "dismissed"; note: string },
    ) {
      const row = await requireReport(input.id);
      requireOpenReport(row);
      await closeReport(row, admin, {
        status: input.resolution,
        resolution: input.note,
        action: row.action,
        actionTargetId: row.actionTargetId,
      });
      logger.info({ adminId: admin.id, reportId: row.id }, "denúncia encerrada");
      return { ok: true as const };
    },

    async search(input: { q: string }): Promise<GlobalSearchResult[]> {
      const term = `%${escapeLike(input.q.trim())}%`;
      const [clientRows, profileRows] = await Promise.all([
        db
          .select()
          .from(users)
          .where(
            and(
              eq(users.role, "cliente"),
              or(ilike(users.name, term), ilike(users.email, term), ilike(users.city, term)),
            ),
          )
          .orderBy(desc(users.createdAt))
          .limit(SEARCH_LIMIT),
        db
          .select()
          .from(professionalProfiles)
          .where(
            and(
              inArray(professionalProfiles.verificationStatus, ["published", "pending_review"]),
              or(
                ilike(professionalProfiles.artisticName, term),
                ilike(professionalProfiles.city, term),
                ilike(professionalProfiles.category, term),
              ),
            ),
          )
          .orderBy(desc(professionalProfiles.updatedAt))
          .limit(SEARCH_LIMIT),
      ]);
      const clientResults: GlobalSearchResult[] = clientRows.map((user) => {
        const { city, state } = splitCityState(user.city);
        return {
          type: "client",
          id: user.id,
          name: user.name,
          subtitle: `${city}, ${state} · ${maskEmail(user.email)}`,
          href: "/admin/clientes",
          status: user.status,
        };
      });
      const professionalResults: GlobalSearchResult[] = profileRows.map((row) => ({
        type: "professional",
        id: row.id,
        name: profileLabel(row),
        subtitle: `${row.category} · ${row.city}, ${row.state}`,
        href: `/admin/perfis/${row.id}`,
        status: row.verificationStatus,
      }));
      return [...clientResults, ...professionalResults];
    },

    async grantPremium(admin: AdminActor, input: { id: string; months?: number }) {
      if (!premium) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Serviço de premium não configurado.",
        });
      }
      const months = input.months ?? 1;
      const row = await requireProfile(input.id);
      await premium.grantManual(row.userId, months);
      await logActivity({
        action: "premium_granted",
        targetName: profileLabel(row),
        targetId: row.id,
        adminEmail: admin.email,
        reason: `Concessão manual de Premium (${months} mês(es))`,
      });
      await notifyProfileOwner(row.userId, {
        key: `premium-granted:${row.id}:${Date.now()}`,
        title: "Plano Premium ativado",
        message: `Seu perfil recebeu acesso ao plano Premium por ${months} mês(es).`,
        href: "/profissional/dashboard",
      });
      logger.info(
        { adminId: admin.id, profileId: row.id, months },
        "premium concedido manualmente",
      );
      return { ok: true as const };
    },
  };
}
