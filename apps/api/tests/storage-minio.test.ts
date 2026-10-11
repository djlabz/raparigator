import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";
import { createS3Storage } from "../src/lib/storage";
import { newId } from "../src/lib/ids";
import { storageKeyFor } from "../src/modules/media/service";

const config = loadConfig(process.env);
const storage = createS3Storage(config);
const ownerUserId = `minio-test-${newId()}`;
const createdKeys: string[] = [];
const body = new TextEncoder().encode("sigillus-minio-test");

async function putTestObject(key: string) {
  await storage.putObject(key, body, "image/jpeg");
  createdKeys.push(key);
}

describe("storage S3 contra o MinIO do compose.yaml", () => {
  beforeAll(async () => {
    if (!config.S3_PUBLIC_BASE_URL) {
      throw new Error(
        "S3_PUBLIC_BASE_URL ausente: o teste de integração do storage precisa do MinIO do compose.yaml (npm run db:up).",
      );
    }
    try {
      await fetch(config.S3_ENDPOINT);
    } catch (error) {
      throw new Error(`MinIO inacessível em ${config.S3_ENDPOINT}: suba com npm run db:up.`, {
        cause: error,
      });
    }
  });

  afterAll(async () => {
    await Promise.all(createdKeys.map((key) => storage.deleteObject(key).catch(() => undefined)));
  });

  it("imagem de galeria é lida anonimamente pela publicUrl", async () => {
    const key = storageKeyFor(ownerUserId, newId(), "image/jpeg", "gallery");
    await putTestObject(key);

    const url = storage.publicUrl(key);
    expect(url).not.toBeNull();
    const response = await fetch(url!);
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
  });

  it("mídia de chat não tem publicUrl, nega GET anônimo e abre pela URL assinada", async () => {
    const key = storageKeyFor(ownerUserId, newId(), "image/jpeg", "chat");
    await putTestObject(key);

    expect(storage.publicUrl(key)).toBeNull();
    const anonymous = await fetch(`${config.S3_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${key}`);
    expect(anonymous.status).toBe(403);
    const signed = await fetch(await storage.presignView(key));
    expect(signed.status).toBe(200);
    expect(new Uint8Array(await signed.arrayBuffer())).toEqual(body);
  });
});
