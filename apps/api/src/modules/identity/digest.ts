import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";
import { createIdentityRepository } from "./repository";

export const ADMIN_IDENTITY_DIGEST_JOB = "admin.identity-digest";
export const ADMIN_IDENTITY_DIGEST_WINDOW_SECONDS = 3600;

export type AdminIdentityDigestDeps = {
  db: Database;
  config: Pick<AppConfig, "ADMIN_NOTIFY_EMAIL" | "WEB_ORIGIN">;
  mailer: Mailer;
  jobs: JobQueue;
  logger: Logger;
};

export async function enqueueAdminIdentityDigest(jobs: JobQueue, now: Date = new Date()) {
  await jobs.enqueue(
    ADMIN_IDENTITY_DIGEST_JOB,
    {},
    { startAfter: new Date(now.getTime() + ADMIN_IDENTITY_DIGEST_WINDOW_SECONDS * 1000) },
  );
}

export function buildAdminIdentityDigestEmail(count: number, webOrigin: string) {
  const subject =
    count === 1
      ? "1 verificação de identidade nova para analisar"
      : `${count} verificações de identidade novas para analisar`;
  const queueUrl = new URL("/admin/verificacoes", webOrigin).toString();
  const text = [
    count === 1
      ? "Uma verificação de identidade de anunciante entrou na fila do Sigillus."
      : `${count} verificações de identidade de anunciantes entraram na fila do Sigillus.`,
    "",
    `Abrir a fila: ${queueUrl}`,
    "",
  ].join("\n");
  return { subject, text };
}

export async function registerAdminIdentityDigestJob(deps: AdminIdentityDigestDeps): Promise<void> {
  const { db, config, mailer, jobs, logger } = deps;
  const repo = createIdentityRepository(db);

  await jobs.work(ADMIN_IDENTITY_DIGEST_JOB, async () => {
    const claimedAt = new Date();
    const claimed = await repo.claimUnnotified(claimedAt);
    if (claimed.length === 0) {
      return;
    }
    if (!config.ADMIN_NOTIFY_EMAIL) {
      logger.info(
        { verifications: claimed.length },
        "notificação de verificações pulada (ADMIN_NOTIFY_EMAIL ausente)",
      );
      return;
    }
    const { subject, text } = buildAdminIdentityDigestEmail(claimed.length, config.WEB_ORIGIN);
    const result = await mailer.send({
      kind: "admin-notify",
      to: config.ADMIN_NOTIFY_EMAIL,
      subject,
      text,
    });
    if (!result.ok) {
      await repo.releaseClaim(
        claimed.map((row) => row.id),
        claimedAt,
      );
      throw new Error("falha ao enviar o resumo de verificações de identidade");
    }
    logger.info({ verifications: claimed.length }, "resumo de verificações enviado ao admin");
  });
}
