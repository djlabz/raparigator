import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import { STORAGE_PURGE_JOB } from "./service";

export type StoragePurgeJobDeps = {
  jobs: JobQueue;
  storage: ObjectStorage;
  logger: Logger;
};

export async function registerStoragePurgeJob({ jobs, storage, logger }: StoragePurgeJobDeps) {
  await jobs.work(STORAGE_PURGE_JOB, async ({ keys }, attempt) => {
    const failed: string[] = [];
    for (const key of keys) {
      try {
        await storage.deleteObject(key);
      } catch (err) {
        failed.push(key);
        logger.warn({ err, key }, "storage.purge: falha ao apagar objeto");
      }
    }
    if (failed.length === 0) {
      logger.info({ objects: keys.length }, "storage.purge concluído");
      return;
    }
    if (attempt.isFinalAttempt) {
      logger.error({ keys: failed }, "storage.purge esgotou as tentativas com objetos restantes");
    }
    throw new Error(`storage.purge: ${failed.length} objeto(s) não apagado(s)`);
  });
}
