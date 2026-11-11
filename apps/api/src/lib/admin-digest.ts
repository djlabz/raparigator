import type { AppConfig } from "../config";
import type { JobName, JobQueue } from "./jobs";
import type { Logger } from "./logger";
import type { Mailer } from "./mail";

type AdminDigestJobName = Extract<JobName, `admin.${string}-digest`>;

export type AdminDigestDeps = {
  config: Pick<AppConfig, "ADMIN_NOTIFY_EMAIL" | "WEB_ORIGIN">;
  mailer: Mailer;
  jobs: JobQueue;
  logger: Logger;
};

export type AdminDigestSpec<T extends { id: string }> = {
  name: AdminDigestJobName;
  topic: string;
  logKey: string;
  claim: (claimedAt: Date) => Promise<T[]>;
  release: (ids: string[], claimedAt: Date) => Promise<void>;
  buildEmail: (claimed: T[], webOrigin: string) => { subject: string; text: string };
};

export async function registerAdminDigestJob<T extends { id: string }>(
  deps: AdminDigestDeps,
  spec: AdminDigestSpec<T>,
): Promise<void> {
  const { config, mailer, jobs, logger } = deps;
  await jobs.work(spec.name, async () => {
    const claimedAt = new Date();
    const claimed = await spec.claim(claimedAt);
    if (claimed.length === 0) {
      return;
    }
    if (!config.ADMIN_NOTIFY_EMAIL) {
      logger.info(
        { [spec.logKey]: claimed.length },
        `notificação de ${spec.topic} pulada (ADMIN_NOTIFY_EMAIL ausente)`,
      );
      return;
    }
    const { subject, text } = spec.buildEmail(claimed, config.WEB_ORIGIN);
    const result = await mailer.send({
      kind: "admin-notify",
      to: config.ADMIN_NOTIFY_EMAIL,
      subject,
      text,
    });
    if (!result.ok) {
      await spec.release(
        claimed.map((row) => row.id),
        claimedAt,
      );
      throw new Error(`falha ao enviar o resumo de ${spec.topic}`);
    }
    logger.info({ [spec.logKey]: claimed.length }, `resumo de ${spec.topic} enviado ao admin`);
  });
}
