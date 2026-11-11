import { ORPCError } from "@orpc/server";
import {
  IDENTITY_VERIFICATION_CONTENT_TYPES,
  IDENTITY_VERIFICATION_MAX_BYTES,
  type IdentityVerificationFiles,
  type IdentityVerificationMine,
  type IdentityVerificationStatus,
  type IdentityVerificationSubmitInput,
  type IdentityVerificationSummary,
  type IdentityVerificationUploadInput,
  type IdentityVerificationUploadOutput,
} from "@sigillus/contracts";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import { PRIVATE_STORAGE_PREFIX, type ObjectStorage } from "../../lib/storage";
import { stripImageMetadata } from "../../lib/image";
import { enqueueAdminIdentityDigest } from "./digest";
import {
  createIdentityRepository,
  type IdentityVerificationListRow,
  type IdentityVerificationRow,
} from "./repository";
import {
  IDENTITY_FILES_RETENTION_DAYS,
  identityPublishGate,
  identityGateNeedsHistory,
  mediaExtensionFor,
} from "@sigillus/domain";
import type { IdentityPublishGate } from "@sigillus/domain";

const IDENTITY_FILE_URL_TTL_SECONDS = 120;

const DAY_MS = 24 * 60 * 60 * 1000;
const FILE_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export type IdentityServiceDeps = {
  db: Database;
  storage: ObjectStorage;
  jobs: JobQueue;
  logger: Logger;
  config: Pick<AppConfig, "IDENTITY_REQUIRED">;
};

export type IdentityReviewer = { id: string; email: string };

export function identityUserPrefix(userId: string): string {
  return `${PRIVATE_STORAGE_PREFIX}identity/${userId}/`;
}

function identityFileKey(userId: string, contentType: string): string {
  return `${identityUserPrefix(userId)}${newId()}.${mediaExtensionFor(contentType)}`;
}

function isAllowedContentType(contentType: string | null): contentType is string {
  return (IDENTITY_VERIFICATION_CONTENT_TYPES as readonly string[]).includes(contentType ?? "");
}

function isOwnKey(userId: string, key: string): boolean {
  const prefix = identityUserPrefix(userId);
  return key.startsWith(prefix) && FILE_NAME.test(key.slice(prefix.length));
}

function isUniqueViolation(error: unknown): boolean {
  const candidate = error as { code?: string; cause?: { code?: string } } | null;
  return candidate?.code === "23505" || candidate?.cause?.code === "23505";
}

function fileKeys(row: Pick<IdentityVerificationRow, "documentKey" | "selfieKey">): string[] {
  return [row.documentKey, row.selfieKey].filter((key): key is string => Boolean(key));
}

function toMine(row: IdentityVerificationRow | null, required: boolean): IdentityVerificationMine {
  return {
    required,
    status: row?.status ?? null,
    rejectReason: row?.status === "rejected" ? (row.rejectReason ?? null) : null,
    submittedAt: row ? row.createdAt.toISOString() : null,
    reviewedAt: row?.reviewedAt ? row.reviewedAt.toISOString() : null,
  };
}

function toSummary(row: IdentityVerificationListRow): IdentityVerificationSummary {
  return {
    id: row.id,
    userId: row.userId,
    artisticName: row.artisticName,
    profileSlug: row.profileSlug,
    status: row.status,
    rejectReason: row.rejectReason,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    filesAvailable: Boolean(row.documentKey && row.selfieKey),
    createdAt: row.createdAt.toISOString(),
  };
}

function activeConflict(status: IdentityVerificationStatus): ORPCError<"CONFLICT", unknown> {
  return new ORPCError("CONFLICT", {
    message:
      status === "approved"
        ? "Sua identidade já foi verificada."
        : "Sua verificação de identidade já está em análise.",
  });
}

export async function deleteIdentityFiles(storage: ObjectStorage, keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => storage.deleteObject(key)));
}

export async function purgeExpiredIdentityFiles(
  deps: { db: Database; storage: ObjectStorage; logger: Logger },
  now: Date = new Date(),
): Promise<number> {
  const repo = createIdentityRepository(deps.db);
  const expired = await repo.listFilesToPurge(
    new Date(now.getTime() - IDENTITY_FILES_RETENTION_DAYS * DAY_MS),
  );
  let purged = 0;
  for (const row of expired) {
    try {
      await deleteIdentityFiles(deps.storage, fileKeys(row));
      await repo.markFilesDeleted(row.id, now);
      purged += 1;
    } catch (err) {
      deps.logger.warn({ err, verificationId: row.id }, "falha ao apagar arquivos de identidade");
    }
  }
  if (purged > 0) {
    deps.logger.info({ purged }, "arquivos de identidade apagados pela retenção");
  }
  return purged;
}

export function createIdentityService(deps: IdentityServiceDeps) {
  const { db, storage, jobs, logger, config } = deps;
  const repo = createIdentityRepository(db);

  async function requireActiveFree(userId: string) {
    const active = await repo.activeForUser(userId);
    if (active) {
      throw activeConflict(active.status);
    }
  }

  async function cleanUploadedFile(key: string): Promise<void> {
    const head = await storage.head(key);
    if (!head) {
      throw new ORPCError("CONFLICT", {
        message: "Envie o documento e a selfie antes de concluir a verificação.",
      });
    }
    if (
      head.sizeBytes > IDENTITY_VERIFICATION_MAX_BYTES ||
      !isAllowedContentType(head.contentType)
    ) {
      throw new ORPCError("CONFLICT", {
        message: "Envie imagens JPG, PNG ou WEBP de até 15 MB.",
      });
    }
    const bytes = await storage.getObject(key);
    const clean = await stripImageMetadata(bytes, head.contentType);
    await storage.putObject(key, clean.data, head.contentType);
  }

  async function reviewPending(
    id: string,
    values: Parameters<typeof repo.reviewPending>[1],
  ): Promise<IdentityVerificationRow> {
    const row = await repo.reviewPending(id, values);
    if (row) {
      return row;
    }
    const existing = await repo.findById(id);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "Verificação não encontrada." });
    }
    throw new ORPCError("CONFLICT", { message: "Esta verificação já foi analisada." });
  }

  return {
    async publishGate(userId: string): Promise<IdentityPublishGate> {
      const required = config.IDENTITY_REQUIRED;
      const active = required ? await repo.activeForUser(userId) : null;
      const activeStatus =
        active?.status === "approved" || active?.status === "pending" ? active.status : null;
      const hasPrevious = identityGateNeedsHistory(required, activeStatus)
        ? Boolean(await repo.latestForUser(userId))
        : false;
      return identityPublishGate({ required, activeStatus, hasPrevious });
    },

    async getMine(userId: string): Promise<IdentityVerificationMine> {
      return toMine(await repo.latestForUser(userId), config.IDENTITY_REQUIRED);
    },

    async createUpload(
      userId: string,
      input: IdentityVerificationUploadInput,
    ): Promise<IdentityVerificationUploadOutput> {
      await requireActiveFree(userId);
      const key = identityFileKey(userId, input.contentType);
      const upload = await storage.presignUpload(key, input.contentType, input.sizeBytes);
      return {
        key,
        uploadUrl: upload.url,
        method: upload.method,
        headers: upload.headers,
        expiresAt: upload.expiresAt.toISOString(),
      };
    },

    async submit(
      userId: string,
      input: IdentityVerificationSubmitInput,
    ): Promise<IdentityVerificationMine> {
      if (!isOwnKey(userId, input.documentKey) || !isOwnKey(userId, input.selfieKey)) {
        throw new ORPCError("FORBIDDEN", { message: "Arquivo de verificação inválido." });
      }
      if (input.documentKey === input.selfieKey) {
        throw new ORPCError("CONFLICT", {
          message: "Envie um arquivo para o documento e outro para a selfie.",
        });
      }
      await requireActiveFree(userId);
      const keys = [input.documentKey, input.selfieKey];
      try {
        for (const key of keys) {
          await cleanUploadedFile(key);
        }
      } catch (err) {
        await deleteIdentityFiles(storage, keys).catch((deleteErr: unknown) =>
          logger.warn(
            { err: deleteErr, userId },
            "falha ao apagar arquivos de identidade enviados",
          ),
        );
        if (err instanceof ORPCError) {
          throw err;
        }
        logger.warn({ err, userId }, "falha ao limpar metadados da verificação de identidade");
        throw new ORPCError("CONFLICT", {
          message: "Não foi possível ler uma das imagens. Envie outra foto.",
        });
      }

      let row: IdentityVerificationRow;
      try {
        row = await repo.insert({
          id: newId(),
          userId,
          status: "pending",
          documentKey: input.documentKey,
          selfieKey: input.selfieKey,
        });
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ORPCError("CONFLICT", {
            message: "Sua verificação de identidade já está em análise.",
          });
        }
        throw err;
      }
      await enqueueAdminIdentityDigest(jobs);
      logger.info({ verificationId: row.id, userId }, "verificação de identidade enviada");
      return toMine(row, config.IDENTITY_REQUIRED);
    },

    async list(status?: IdentityVerificationStatus): Promise<IdentityVerificationSummary[]> {
      return (await repo.list(status)).map(toSummary);
    },

    async fileUrls(id: string): Promise<IdentityVerificationFiles> {
      const row = await repo.findById(id);
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Verificação não encontrada." });
      }
      if (!row.documentKey || !row.selfieKey) {
        throw new ORPCError("NOT_FOUND", {
          message: "Os arquivos desta verificação já foram apagados.",
        });
      }
      const [documentUrl, selfieUrl] = await Promise.all([
        storage.presignView(row.documentKey, IDENTITY_FILE_URL_TTL_SECONDS),
        storage.presignView(row.selfieKey, IDENTITY_FILE_URL_TTL_SECONDS),
      ]);
      return {
        id: row.id,
        documentUrl,
        selfieUrl,
        expiresInSeconds: IDENTITY_FILE_URL_TTL_SECONDS,
      };
    },

    async approve(id: string, reviewer: IdentityReviewer): Promise<{ ok: true }> {
      const row = await reviewPending(id, {
        status: "approved",
        reviewedBy: reviewer.email,
        reviewedAt: new Date(),
        rejectReason: null,
      });
      logger.info(
        { verificationId: row.id, userId: row.userId, adminId: reviewer.id },
        "verificação de identidade aprovada",
      );
      return { ok: true };
    },

    async reject(id: string, reason: string, reviewer: IdentityReviewer): Promise<{ ok: true }> {
      const now = new Date();
      const row = await reviewPending(id, {
        status: "rejected",
        reviewedBy: reviewer.email,
        reviewedAt: now,
        rejectReason: reason,
      });
      try {
        await deleteIdentityFiles(storage, fileKeys(row));
        await repo.markFilesDeleted(row.id, now);
      } catch (err) {
        logger.warn({ err, verificationId: row.id }, "falha ao apagar arquivos de identidade");
      }
      logger.info(
        { verificationId: row.id, userId: row.userId, adminId: reviewer.id },
        "verificação de identidade reprovada",
      );
      return { ok: true };
    },
  };
}
