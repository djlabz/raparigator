import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import { deleteIdentityFiles, identityUserPrefix, purgeExpiredIdentityFiles } from "./service";

export const IDENTITY_RETENTION_JOB = "identity.retention";
export const IDENTITY_DELETE_FILES_JOB = "identity.delete-files";
export const IDENTITY_RETENTION_CRON = "0 4 * * *";

export type IdentityJobsDeps = {
  db: Database;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
};

export async function registerIdentityJobs(deps: IdentityJobsDeps): Promise<void> {
  const { db, storage, jobs, logger } = deps;

  await jobs.work(IDENTITY_RETENTION_JOB, async () => {
    await purgeExpiredIdentityFiles({ db, storage, logger });
  });

  await jobs.work(IDENTITY_DELETE_FILES_JOB, async ({ userId, keys }) => {
    const prefix = identityUserPrefix(userId);
    const owned = keys.filter((key) => key.startsWith(prefix));
    await deleteIdentityFiles(storage, owned);
    logger.info({ userId, files: owned.length }, "arquivos de identidade apagados com a conta");
  });
}
