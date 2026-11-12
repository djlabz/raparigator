import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AppConfig } from "../config";
import type { Logger } from "./logger";

export const PUBLIC_STORAGE_PREFIX = "public/";
export const PRIVATE_STORAGE_PREFIX = "private/";

function isPublicKey(key: string): boolean {
  return key.startsWith(PUBLIC_STORAGE_PREFIX);
}

type PresignedUpload = {
  url: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresAt: Date;
};

export interface ObjectStorage {
  presignUpload(key: string, contentType: string, sizeBytes: number): Promise<PresignedUpload>;
  presignView(key: string, ttlSeconds?: number): Promise<string>;
  publicUrl(key: string): string | null;
  head(key: string): Promise<{ sizeBytes: number; contentType: string | null } | null>;
  getObject(key: string): Promise<Uint8Array>;
  putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
  listKeys(prefix: string): Promise<string[]>;
}

const UPLOAD_GRACE_MULTIPLIER = 2;

export function uploadGracePeriodMs(uploadTtlSeconds: number): number {
  return uploadTtlSeconds * UPLOAD_GRACE_MULTIPLIER * 1000;
}

export async function deleteObjectsBestEffort(
  storage: ObjectStorage,
  keys: Array<string | null | undefined>,
  logger: Logger,
) {
  for (const key of keys) {
    if (!key) {
      continue;
    }
    try {
      await storage.deleteObject(key);
    } catch (err) {
      logger.warn({ err, key }, "storage.delete falhou");
    }
  }
}

const TRANSIENT_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
]);
const TRANSIENT_ERROR_NAMES = new Set([
  "TimeoutError",
  "AbortError",
  "RequestTimeout",
  "SlowDown",
  "ServiceUnavailable",
  "InternalError",
]);

export function isTransientStorageError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }
  const detail = err as Error & { code?: string; $metadata?: { httpStatusCode?: number } };
  const status = detail.$metadata?.httpStatusCode;
  return (
    (status !== undefined && status >= 500) ||
    TRANSIENT_ERROR_NAMES.has(err.name) ||
    (detail.code !== undefined && TRANSIENT_ERROR_CODES.has(detail.code))
  );
}

function isNotFound(err: unknown) {
  if (!(err instanceof Error)) {
    return false;
  }
  const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
  return err.name === "NotFound" || err.name === "NoSuchKey" || status === 404;
}

function createS3Client(config: AppConfig, endpoint: string): S3Client {
  return new S3Client({
    endpoint,
    region: config.S3_REGION,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: config.S3_ACCESS_KEY_ID,
      secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    },
  });
}

export function createS3Storage(config: AppConfig): ObjectStorage {
  const client = createS3Client(config, config.S3_ENDPOINT);
  const presignClient = config.S3_PUBLIC_ENDPOINT
    ? createS3Client(config, config.S3_PUBLIC_ENDPOINT)
    : client;
  const bucket = config.S3_BUCKET;

  return {
    async presignUpload(key, contentType, sizeBytes) {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
        ContentLength: sizeBytes,
      });
      const url = await getSignedUrl(presignClient, command, {
        expiresIn: config.MEDIA_UPLOAD_TTL_SECONDS,
      });
      return {
        url,
        method: "PUT",
        headers: { "content-type": contentType },
        expiresAt: new Date(Date.now() + config.MEDIA_UPLOAD_TTL_SECONDS * 1000),
      };
    },
    async presignView(key, ttlSeconds = config.MEDIA_VIEW_URL_TTL_SECONDS) {
      return getSignedUrl(presignClient, new GetObjectCommand({ Bucket: bucket, Key: key }), {
        expiresIn: ttlSeconds,
      });
    },
    publicUrl(key) {
      if (!config.S3_PUBLIC_BASE_URL || !isPublicKey(key)) {
        return null;
      }
      return `${config.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
    },
    async head(key) {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { sizeBytes: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
      } catch (err) {
        if (isNotFound(err)) {
          return null;
        }
        throw err;
      }
    },
    async getObject(key) {
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      if (!bytes) {
        throw new Error(`objeto vazio: ${key}`);
      }
      return bytes;
    },
    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },
    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
    async listKeys(prefix) {
      const keys: string[] = [];
      let continuationToken: string | undefined;
      do {
        const page = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        for (const object of page.Contents ?? []) {
          if (object.Key) {
            keys.push(object.Key);
          }
        }
        continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
      } while (continuationToken);
      return keys;
    },
  };
}

export function createMemoryStorage(baseUrl = "http://storage.test"): ObjectStorage & {
  objects: Map<string, { body: Uint8Array; contentType: string }>;
} {
  const objects = new Map<string, { body: Uint8Array; contentType: string }>();
  return {
    objects,
    async presignUpload(key, contentType) {
      return {
        url: `${baseUrl}/upload/${encodeURIComponent(key)}`,
        method: "PUT",
        headers: { "content-type": contentType },
        expiresAt: new Date(Date.now() + 900_000),
      };
    },
    async presignView(key) {
      return `${baseUrl}/view/${encodeURIComponent(key)}?signed=1`;
    },
    publicUrl(key) {
      return isPublicKey(key) ? `${baseUrl}/${key}` : null;
    },
    async head(key) {
      const object = objects.get(key);
      return object ? { sizeBytes: object.body.byteLength, contentType: object.contentType } : null;
    },
    async getObject(key) {
      const object = objects.get(key);
      if (!object) {
        throw new Error(`objeto não encontrado: ${key}`);
      }
      return object.body;
    },
    async putObject(key, body, contentType) {
      objects.set(key, { body, contentType });
    },
    async deleteObject(key) {
      objects.delete(key);
    },
    async listKeys(prefix) {
      return [...objects.keys()].filter((key) => key.startsWith(prefix));
    },
  };
}
