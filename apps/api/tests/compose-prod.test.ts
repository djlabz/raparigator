import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";
import { createTestHarness } from "./helpers/app";

const composeFile = fileURLToPath(new URL("../../../compose.prod.yaml", import.meta.url));

const validEnv: Record<string, string> = {
  POSTGRES_USER: "sigillus",
  POSTGRES_PASSWORD: "p".repeat(64),
  POSTGRES_DB: "sigillus",
  S3_ACCESS_KEY_ID: "sigillus",
  S3_SECRET_ACCESS_KEY: "s".repeat(64),
  S3_BUCKET: "sigillus-media",
  S3_PUBLIC_BASE_URL: "https://media.example.com/sigillus-media",
  API_ORIGIN: "https://api.example.com",
  WEB_ORIGIN: "https://app.example.com",
  CORS_ORIGINS: "https://app.example.com",
  COOKIE_DOMAIN: ".example.com",
  NEXT_PUBLIC_API_URL: "https://api.example.com",
  AUTH_SECRET: "a".repeat(64),
  BILLING_WEBHOOK_SECRET: "b".repeat(64),
  RESEND_API_KEY: "re_test_fake",
};

type ComposePort = { host_ip?: string; published?: string; target: number };
type ComposeService = {
  image?: string;
  ports?: ComposePort[];
  environment?: Record<string, string | null>;
};
type ComposeConfig = { services: Record<string, ComposeService> };

let workDir: string;

function writeEnvFile(env: Record<string, string>): string {
  const file = join(workDir, `env-${Math.random().toString(36).slice(2)}`);
  writeFileSync(
    file,
    Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  );
  return file;
}

function composeArgs(envFile: string) {
  return ["compose", "-f", composeFile, "--env-file", envFile, "config", "--format", "json"];
}

const isolatedEnv = { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "" };

function renderCompose(env: Record<string, string>): ComposeConfig {
  const output = execFileSync("docker", composeArgs(writeEnvFile(env)), {
    env: isolatedEnv,
    encoding: "utf8",
  });
  return JSON.parse(output) as ComposeConfig;
}

function apiEnvironment(config: ComposeConfig): Record<string, string> {
  const environment = config.services.api?.environment ?? {};
  return Object.fromEntries(Object.entries(environment).map(([key, value]) => [key, value ?? ""]));
}

describe("compose.prod.yaml", () => {
  let config: ComposeConfig;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), "sigillus-compose-"));
    config = renderCompose(validEnv);
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("entrega à API um env que passa no config de produção", () => {
    expect(() => loadConfig(apiEnvironment(config))).not.toThrow();
  });

  it("define API_ORIGIN e liga o rate limit", () => {
    const environment = apiEnvironment(config);
    expect(environment).toHaveProperty("API_ORIGIN");
    expect(environment).toHaveProperty("RATE_LIMIT_ENABLED");
    const loaded = loadConfig(environment);
    expect(loaded.API_ORIGIN).toBe(validEnv.API_ORIGIN);
    expect(loaded.RATE_LIMIT_ENABLED).toBe(true);
  });

  it("publica portas só no loopback e não expõe Postgres nem o console do MinIO", () => {
    const published = Object.entries(config.services).flatMap(([name, service]) =>
      (service.ports ?? []).map((port) => ({ name, ...port })),
    );
    expect(published.length).toBeGreaterThan(0);
    for (const port of published) {
      expect({ service: port.name, host_ip: port.host_ip }).toEqual({
        service: port.name,
        host_ip: "127.0.0.1",
      });
    }
    expect(config.services.postgres?.ports ?? []).toEqual([]);
    expect(published.some((port) => port.target === 9001)).toBe(false);
  });

  it("pina as imagens de terceiros", () => {
    for (const name of ["minio", "minio-init"]) {
      expect(config.services[name]?.image).toMatch(/@sha256:[0-9a-f]{64}$/);
    }
  });

  it("recusa subir sem BILLING_WEBHOOK_SECRET", () => {
    const { BILLING_WEBHOOK_SECRET: _omitted, ...withoutSecret } = validEnv;
    const result = spawnSync("docker", composeArgs(writeEnvFile(withoutSecret)), {
      env: isolatedEnv,
      encoding: "utf8",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("BILLING_WEBHOOK_SECRET");
  });
});

const previousRateLimit = process.env.RATE_LIMIT_ENABLED;
process.env.RATE_LIMIT_ENABLED = "true";
const harness = createTestHarness();

afterAll(() => {
  process.env.RATE_LIMIT_ENABLED = previousRateLimit;
});

describe("rate limit do login com RATE_LIMIT_ENABLED=true", () => {
  it("bloqueia a sexta tentativa de login no mesmo minuto", async () => {
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await harness.fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
        body: JSON.stringify({ email: "rate-limit@teste.dev", password: "senha-errada" }),
      });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5)).not.toContain(429);
    expect(statuses[5]).toBe(429);
  });
});
