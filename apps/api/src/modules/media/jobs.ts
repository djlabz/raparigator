import sharp, { type Sharp } from "sharp";
import { isBlockedHash } from "@sigillus/domain";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import { computeImageHash } from "../reports/image-hash";
import { createReportsRepository } from "../reports/repository";
import { createMediaRepository } from "./repository";

export type MediaJobsDeps = {
  db: Database;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
};

const MEDIA_THUMBNAIL_WIDTH = 480;
const BLOCKED_MEDIA_MESSAGE = "Esta imagem não pode ser publicada.";

function thumbnailKeyFor(storageKey: string): string {
  return `${storageKey}.thumb.webp`;
}

export type StrippedImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

function encodeAs(image: Sharp, contentType: string): Sharp {
  switch (contentType) {
    case "image/jpeg":
      return image.jpeg({ quality: 90, mozjpeg: true });
    case "image/png":
      return image.png();
    case "image/webp":
      return image.webp({ quality: 90 });
    case "image/avif":
      return image.avif();
    case "image/gif":
      return image.gif();
    default:
      throw new Error(`formato de imagem sem limpeza de metadados: ${contentType}`);
  }
}

export async function stripImageMetadata(
  bytes: Uint8Array,
  contentType: string,
): Promise<StrippedImage> {
  const image = encodeAs(sharp(Buffer.from(bytes), { failOn: "none" }).rotate(), contentType);
  const { data, info } = await image.toBuffer({ resolveWithObject: true });
  return { data: new Uint8Array(data), width: info.width, height: info.height };
}

export async function registerMediaJobs(deps: MediaJobsDeps): Promise<void> {
  const { db, storage, jobs, logger } = deps;
  const repo = createMediaRepository(db);
  const reports = createReportsRepository(db);

  async function findBlockingReport(hash: string): Promise<string | null> {
    const blocked = await reports.listBlockedHashes();
    const match = blocked.find((entry) => isBlockedHash(hash, [entry.hash]));
    return match ? match.reportId : null;
  }

  await jobs.work("media.process", async ({ assetId }) => {
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
          await storage.deleteObject(row.storageKey).catch(() => undefined);
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
