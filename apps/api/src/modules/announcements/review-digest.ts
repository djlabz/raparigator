import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import { professionalProfiles } from "../../db/schema";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";
import { formatDateBR } from "@sigillus/domain";
import { registerAdminDigestJob } from "../../lib/admin-digest";

export const ADMIN_REVIEW_DIGEST_JOB = "admin.review-digest";
export const ADMIN_REVIEW_DIGEST_WINDOW_SECONDS = 3600;

export type AdminReviewDigestDeps = {
  db: Database;
  config: Pick<AppConfig, "ADMIN_NOTIFY_EMAIL" | "WEB_ORIGIN">;
  mailer: Mailer;
  jobs: JobQueue;
  logger: Logger;
};

type PendingProfile = {
  id: string;
  artisticName: string;
  displayName: string;
  city: string;
  state: string;
  submittedAt: Date | null;
};

export async function enqueueAdminReviewDigest(jobs: JobQueue, now: Date = new Date()) {
  await jobs.enqueue(
    ADMIN_REVIEW_DIGEST_JOB,
    {},
    { startAfter: new Date(now.getTime() + ADMIN_REVIEW_DIGEST_WINDOW_SECONDS * 1000) },
  );
}

function reviewUrl(webOrigin: string, profileId: string): string {
  return new URL(`/admin/perfis/${encodeURIComponent(profileId)}`, webOrigin).toString();
}

function buildAdminReviewDigestEmail(profiles: PendingProfile[], webOrigin: string) {
  const subject =
    profiles.length === 1
      ? "1 perfil novo aguardando revisão"
      : `${profiles.length} perfis novos aguardando revisão`;
  const lines = profiles.map((profile) => {
    const name = profile.artisticName || profile.displayName || "Sem nome";
    const place =
      [profile.city, profile.state].filter(Boolean).join(" - ") || "Cidade não informada";
    return [
      `- ${name}`,
      `  Cidade: ${place}`,
      `  Enviado em: ${formatDateBR(profile.submittedAt, "dateTime", "-")}`,
      `  Revisar: ${reviewUrl(webOrigin, profile.id)}`,
    ].join("\n");
  });
  const text = [
    profiles.length === 1
      ? "Um perfil entrou na fila de revisão do Sigillus:"
      : `${profiles.length} perfis entraram na fila de revisão do Sigillus:`,
    "",
    lines.join("\n\n"),
    "",
  ].join("\n");
  return { subject, text };
}

export async function registerAdminReviewDigestJob(deps: AdminReviewDigestDeps): Promise<void> {
  const { db } = deps;
  await registerAdminDigestJob(deps, {
    name: ADMIN_REVIEW_DIGEST_JOB,
    topic: "perfis em revisão",
    logKey: "profiles",
    claim: (claimedAt) =>
      db
        .update(professionalProfiles)
        .set({ reviewNotifiedAt: claimedAt })
        .where(
          and(
            eq(professionalProfiles.verificationStatus, "pending_review"),
            isNotNull(professionalProfiles.submittedAt),
            or(
              isNull(professionalProfiles.reviewNotifiedAt),
              lt(professionalProfiles.reviewNotifiedAt, professionalProfiles.submittedAt),
            ),
          ),
        )
        .returning({
          id: professionalProfiles.id,
          artisticName: professionalProfiles.artisticName,
          displayName: professionalProfiles.displayName,
          city: professionalProfiles.city,
          state: professionalProfiles.state,
          submittedAt: professionalProfiles.submittedAt,
        }),
    release: async (ids, claimedAt) => {
      await db
        .update(professionalProfiles)
        .set({ reviewNotifiedAt: null })
        .where(
          and(
            inArray(professionalProfiles.id, ids),
            eq(professionalProfiles.reviewNotifiedAt, claimedAt),
          ),
        );
    },
    buildEmail: (claimed, webOrigin) =>
      buildAdminReviewDigestEmail(
        [...claimed].sort(
          (a, b) => (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0),
        ),
        webOrigin,
      ),
  });
}
