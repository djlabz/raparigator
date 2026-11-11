import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";
import { createIdentityRepository } from "./repository";
import { registerAdminDigestJob } from "../../lib/admin-digest";

export const ADMIN_IDENTITY_DIGEST_JOB = "admin.identity-digest";
const ADMIN_IDENTITY_DIGEST_WINDOW_SECONDS = 3600;

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

function buildAdminIdentityDigestEmail(count: number, webOrigin: string) {
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
  const repo = createIdentityRepository(deps.db);
  await registerAdminDigestJob(deps, {
    name: ADMIN_IDENTITY_DIGEST_JOB,
    topic: "verificações de identidade",
    logKey: "verifications",
    claim: (claimedAt) => repo.claimUnnotified(claimedAt),
    release: (ids, claimedAt) => repo.releaseClaim(ids, claimedAt),
    buildEmail: (claimed, webOrigin) => buildAdminIdentityDigestEmail(claimed.length, webOrigin),
  });
}
