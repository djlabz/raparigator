import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import { professionalProfiles } from "../../db/schema";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";

export const ADMIN_REVIEW_DIGEST_JOB = "admin.review-digest";
export const ADMIN_REVIEW_DIGEST_WINDOW_SECONDS = 3600;

const DIGEST_TIME_ZONE = "America/Sao_Paulo";

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

function formatDate(date: Date | null): string {
  if (!date) {
    return "-";
  }
  return date.toLocaleString("pt-BR", {
    timeZone: DIGEST_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reviewUrl(webOrigin: string, profileId: string): string {
  return new URL(`/admin/perfis/${encodeURIComponent(profileId)}`, webOrigin).toString();
}

export function buildAdminReviewDigestEmail(profiles: PendingProfile[], webOrigin: string) {
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
      `  Enviado em: ${formatDate(profile.submittedAt)}`,
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
  const { db, config, mailer, jobs, logger } = deps;

  await jobs.work(ADMIN_REVIEW_DIGEST_JOB, async () => {
    const claimedAt = new Date();
    const claimed = await db
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
      });

    if (claimed.length === 0) {
      return;
    }

    if (!config.ADMIN_NOTIFY_EMAIL) {
      logger.info(
        { profiles: claimed.length },
        "notificação de perfis em revisão pulada (ADMIN_NOTIFY_EMAIL ausente)",
      );
      return;
    }

    const ordered = [...claimed].sort(
      (a, b) => (a.submittedAt?.getTime() ?? 0) - (b.submittedAt?.getTime() ?? 0),
    );
    const { subject, text } = buildAdminReviewDigestEmail(ordered, config.WEB_ORIGIN);
    const result = await mailer.send({
      kind: "admin-notify",
      to: config.ADMIN_NOTIFY_EMAIL,
      subject,
      text,
    });
    if (!result.ok) {
      await db
        .update(professionalProfiles)
        .set({ reviewNotifiedAt: null })
        .where(
          and(
            inArray(
              professionalProfiles.id,
              claimed.map((profile) => profile.id),
            ),
            eq(professionalProfiles.reviewNotifiedAt, claimedAt),
          ),
        );
      throw new Error("falha ao enviar o resumo de perfis em revisão");
    }
    logger.info({ profiles: claimed.length }, "resumo de perfis em revisão enviado ao admin");
  });
}
