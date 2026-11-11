import sharp from "sharp";
import { isBlockedHash } from "@sigillus/domain";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import {
  deleteObjectsBestEffort,
  isTransientStorageError,
  type ObjectStorage,
} from "../../lib/storage";
import { computeImageHash, stripImageMetadata } from "../../lib/image";
import { createMediaRepository } from "./repository";

export type MediaJobsDeps = {
  db: Database;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
  listBlockedHashes: () => Promise<Array<{ hash: string; reportId: string }>>;
};

const MEDIA_THUMBNAIL_WIDTH = 480;
const BLOCKED_MEDIA_MESSAGE = "Esta imagem não pode ser publicada.";

function thumbnailKeyFor(storageKey: string): string {
  return `${storageKey}.thumb.webp`;
}

export async function registerMediaJobs(deps: MediaJobsDeps): Promise<void> {
  const { db, storage, jobs, logger, listBlockedHashes } = deps;
  const repo = createMediaRepository(db);

  async function findBlockingReport(hash: string): Promise<string | null> {
    const blocked = await listBlockedHashes();
    const match = blocked.find((entry) => isBlockedHash(hash, [entry.hash]));
    return match ? match.reportId : null;
  }

  await jobs.work("media.process", async ({ assetId }, { isFinalAttempt }) => {
    const row = await repo.findById(assetId);
    if (!row) {
      logger.warn({ assetId }, "media.process: asset inexistente");
      return;
    }
    if (row.status !== "processing") {
      return;
    }
    try {
      if (row.kind === "image") {
        const bytes = await storage.getObject(row.storageKey);
        const clean = await stripImageMetadata(bytes, row.contentType);
        const hash = await computeImageHash(clean.data);
        const blockingReportId = await findBlockingReport(hash);
        if (blockingReportId) {
          await deleteObjectsBestEffort(storage, [row.storageKey], logger);
          await repo.update(row.id, {
            status: "blocked",
            moderationReason: BLOCKED_MEDIA_MESSAGE,
            blockReason: `Imagem semelhante à retirada pela Denúncia #${blockingReportId}`,
            blockedByReportId: blockingReportId,
            processedAt: new Date(),
          });
          logger.info({ assetId, reportId: blockingReportId }, "imagem bloqueada por denúncia");
          return;
        }
        await storage.putObject(row.storageKey, clean.data, row.contentType);
        const thumbnail = await sharp(Buffer.from(clean.data), { failOn: "none" })
          .resize({ width: MEDIA_THUMBNAIL_WIDTH, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        const thumbnailKey = thumbnailKeyFor(row.storageKey);
        await storage.putObject(thumbnailKey, new Uint8Array(thumbnail), "image/webp");
        await repo.update(row.id, {
          status: "ready",
          width: clean.width,
          height: clean.height,
          sizeBytes: clean.data.byteLength,
          thumbnailKey,
          processedAt: new Date(),
        });
      } else {
        const head = await storage.head(row.storageKey);
        if (!head) {
          throw new Error("objeto de vídeo não encontrado no storage");
        }
        await repo.update(row.id, { status: "ready", processedAt: new Date() });
      }
    } catch (error) {
      if (isTransientStorageError(error) && !isFinalAttempt) {
        logger.warn({ err: error, assetId }, "media.process: falha transitória, nova tentativa");
        throw error;
      }
      logger.error({ err: error, assetId }, "media.process falhou");
      await repo.update(row.id, { status: "failed", processedAt: new Date() });
      return;
    }
    await jobs.enqueue("media.moderate", { assetId }, { singletonKey: `moderate:${assetId}` });
  });

  await jobs.work("media.moderate", async ({ assetId }) => {
    const row = await repo.findById(assetId);
    if (!row || row.status !== "ready") {
      return;
    }
    logger.debug({ assetId }, "media.moderate: sem integração de moderação, mantendo ready");
  });
}
