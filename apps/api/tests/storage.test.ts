import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";
import { createS3Storage } from "../src/lib/storage";

const baseEnv = {
  DATABASE_URL: "postgres://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(32),
  S3_ENDPOINT: "http://minio:9000",
  S3_BUCKET: "sigillus-media",
  S3_ACCESS_KEY_ID: "a",
  S3_SECRET_ACCESS_KEY: "s",
  S3_FORCE_PATH_STYLE: "true",
  S3_PUBLIC_BASE_URL: "https://media.example.com/sigillus-media",
  BILLING_WEBHOOK_SECRET: "y".repeat(16),
};

describe("storage S3", () => {
  it("assina upload e view com o endpoint público quando S3_PUBLIC_ENDPOINT está definido", async () => {
    const storage = createS3Storage(
      loadConfig({ ...baseEnv, S3_PUBLIC_ENDPOINT: "https://media.example.com" }),
    );

    const upload = new URL((await storage.presignUpload("u/1/a.jpg", "image/jpeg", 1024)).url);
    const view = new URL(await storage.presignView("u/1/a.jpg"));

    for (const url of [upload, view]) {
      expect(url.host).toBe("media.example.com");
      expect(url.protocol).toBe("https:");
      expect(url.pathname.startsWith("/sigillus-media/")).toBe(true);
    }
  });

  it("sem S3_PUBLIC_ENDPOINT mantém o host de S3_ENDPOINT", async () => {
    const storage = createS3Storage(loadConfig({ ...baseEnv }));

    const upload = new URL((await storage.presignUpload("u/1/a.jpg", "image/jpeg", 1024)).url);
    const view = new URL(await storage.presignView("u/1/a.jpg"));

    for (const url of [upload, view]) {
      expect(url.host).toBe("minio:9000");
      expect(url.protocol).toBe("http:");
      expect(url.pathname.startsWith("/sigillus-media/")).toBe(true);
    }
  });

  it("publicUrl continua usando S3_PUBLIC_BASE_URL", () => {
    const storage = createS3Storage(
      loadConfig({ ...baseEnv, S3_PUBLIC_ENDPOINT: "https://media.example.com" }),
    );
    expect(storage.publicUrl("public/x.jpg")).toBe(
      "https://media.example.com/sigillus-media/public/x.jpg",
    );
  });

  it("loadConfig aceita S3_PUBLIC_ENDPOINT vazio e rejeita valor que não é URL", () => {
    expect(loadConfig({ ...baseEnv, S3_PUBLIC_ENDPOINT: "" }).S3_PUBLIC_ENDPOINT).toBeUndefined();
    expect(() => loadConfig({ ...baseEnv, S3_PUBLIC_ENDPOINT: "media.example.com" })).toThrow(
      /S3_PUBLIC_ENDPOINT/,
    );
  });
});
