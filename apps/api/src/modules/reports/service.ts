import {
  REPORT_RESPONSE_SLA_HOURS,
  type CompleteReportEvidenceInput,
  type CompleteReportEvidenceOutput,
  type CreatePublicReportInput,
  type CreatePublicReportOutput,
  type ReportType,
  type UserRole,
} from "@sigillus/contracts";
import { ORPCError } from "@orpc/server";
import type { Database } from "../../db/client";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { RateLimitRule } from "../../lib/rate-limit";
import { PRIVATE_STORAGE_PREFIX, type ObjectStorage } from "../../lib/storage";
import { extensionFor } from "../media/service";
import type { ProfileRepository } from "../profiles/repository";
import { enqueueAdminReportDigest } from "./digest";
import { REPORT_EVIDENCE_PROCESS_JOB, isEvidenceUploadOpen } from "./evidence";
import { createReportsRepository } from "./repository";

export const PUBLIC_REPORT_RATE_LIMIT = { windowMs: 60_000, max: 5 } satisfies RateLimitRule;

const AD_PATH = /^\/anuncio\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/;

export type ReportsServiceDeps = {
  db: Database;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
  profiles: ProfileRepository;
};

export type ChatReportInput = {
  type: ReportType;
  reporterUserId: string;
  reporterName: string;
  reporterRole: UserRole;
  reportedUserId: string;
  reportedName: string;
  reportedRole: UserRole;
  conversationId: string;
  targetProfileId: string | null;
  description: string;
};

export type ReportsService = ReturnType<typeof createReportsService>;

function reportEvidenceKey(reportId: string, evidenceId: string, contentType: string) {
  return `${PRIVATE_STORAGE_PREFIX}reports/${reportId}/${evidenceId}.${extensionFor(contentType)}`;
}

function slugFromAdUrl(targetUrl: string): string | null {
  try {
    const { pathname } = new URL(targetUrl);
    return AD_PATH.exec(pathname)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function createReportsService(deps: ReportsServiceDeps) {
  const { db, storage, jobs, logger, profiles } = deps;
  const repo = createReportsRepository(db);

  return {
    async recordChatReport(input: ChatReportInput): Promise<string> {
      const row = await repo.insert({
        id: newId(),
        source: "chat",
        status: "pending",
        ...input,
      });
      await enqueueAdminReportDigest(jobs);
      logger.info(
        {
          reportId: row.id,
          source: "chat",
          conversationId: input.conversationId,
          type: input.type,
        },
        "denúncia registrada",
      );
      return row.id;
    },

    async createPublic(input: CreatePublicReportInput): Promise<CreatePublicReportOutput> {
      const slug = input.profileSlug ?? (input.targetUrl ? slugFromAdUrl(input.targetUrl) : null);
      const profile = slug ? await profiles.findBySlug(slug) : null;
      const reportId = newId();
      await repo.insert({
        id: reportId,
        source: "public",
        type: "other",
        reason: input.reason,
        reportedUserId: profile?.userId ?? null,
        reportedName: profile ? profile.artisticName || profile.slug : null,
        reportedRole: profile ? "profissional" : null,
        targetProfileId: profile?.id ?? null,
        targetUrl: input.targetUrl ?? null,
        profileSlug: slug,
        contactEmail: input.contactEmail ?? null,
        description: input.details,
        status: "pending",
      });

      const evidence = input.evidence.map((file) => {
        const id = newId();
        return {
          id,
          reportId,
          storageKey: reportEvidenceKey(reportId, id, file.contentType),
          contentType: file.contentType,
          sizeBytes: file.sizeBytes,
        };
      });
      await repo.insertEvidence(evidence);
      const evidenceUploads = await Promise.all(
        evidence.map(async (file) => {
          const upload = await storage.presignUpload(
            file.storageKey,
            file.contentType,
            file.sizeBytes,
          );
          return {
            uploadUrl: upload.url,
            method: upload.method,
            headers: upload.headers,
            expiresAt: upload.expiresAt.toISOString(),
          };
        }),
      );

      await enqueueAdminReportDigest(jobs);
      logger.info(
        {
          reportId,
          source: "public",
          reason: input.reason,
          evidence: evidence.length,
          targetFound: Boolean(profile),
        },
        "denúncia pública registrada",
      );
      return { reportId, responseSlaHours: REPORT_RESPONSE_SLA_HOURS, evidenceUploads };
    },

    async completeEvidence(
      input: CompleteReportEvidenceInput,
    ): Promise<CompleteReportEvidenceOutput> {
      const report = await repo.findById(input.reportId);
      if (!report || report.source !== "public") {
        throw new ORPCError("NOT_FOUND", { message: "Denúncia não encontrada." });
      }
      const pending = await repo.listUnconfirmedEvidence(report.id);
      const now = new Date();
      let confirmed = 0;
      for (const file of pending) {
        if (!isEvidenceUploadOpen(file.createdAt, now) || !(await storage.head(file.storageKey))) {
          continue;
        }
        await jobs.enqueue(
          REPORT_EVIDENCE_PROCESS_JOB,
          { evidenceId: file.id },
          {
            singletonKey: file.id,
          },
        );
        confirmed += 1;
      }
      logger.info({ reportId: report.id, confirmed }, "provas da denúncia confirmadas");
      return { confirmed };
    },
  };
}
