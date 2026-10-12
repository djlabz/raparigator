import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const script = fileURLToPath(new URL("../../../scripts/check-prod-env.sh", import.meta.url));

const validEnv: Record<string, string> = {
  POSTGRES_PASSWORD: "p".repeat(64),
  S3_SECRET_ACCESS_KEY: "s".repeat(64),
  AUTH_SECRET: "a".repeat(64),
  BILLING_WEBHOOK_SECRET: "b".repeat(64),
  WEB_ORIGIN: "https://app.example.com",
  API_ORIGIN: "https://api.example.com",
  NEXT_PUBLIC_API_URL: "https://api.example.com",
  S3_PUBLIC_BASE_URL: "https://media.example.com/sigillus-media",
  S3_PUBLIC_ENDPOINT: "https://media.example.com",
  CORS_ORIGINS: "https://app.example.com",
  COOKIE_DOMAIN: ".example.com",
  RATE_LIMIT_ENABLED: "true",
  VERIFICATION_DEV_CODES: "false",
  OPENAPI_DOCS_ENABLED: "false",
  BILLING_PROVIDER: "fake",
  BILLING_FAKE_ACKNOWLEDGED: "true",
  MAIL_PROVIDER: "resend",
  RESEND_API_KEY: "re_test_fake",
  MAIL_FROM: "Sigillus <nao-responda@example.com>",
  IDENTITY_REQUIRED: "true",
};

let workDir: string;

function runPreflight(env: Record<string, string>) {
  const file = join(workDir, `env-${Math.random().toString(36).slice(2)}`);
  writeFileSync(
    file,
    Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  );
  const result = spawnSync("bash", [script, file], { encoding: "utf8" });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe("scripts/check-prod-env.sh", () => {
  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), "sigillus-preflight-"));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  it("aprova o env de produção válido com IDENTITY_REQUIRED=true", () => {
    const result = runPreflight(validEnv);
    expect(result.output).toContain("IDENTITY_REQUIRED");
    expect(result.status).toBe(0);
  });

  it("reprova IDENTITY_REQUIRED=false", () => {
    const result = runPreflight({ ...validEnv, IDENTITY_REQUIRED: "false" });
    expect(result.status).not.toBe(0);
    expect(result.output).toMatch(/FALHA.*IDENTITY_REQUIRED/);
  });

  it("reprova IDENTITY_REQUIRED ausente", () => {
    const { IDENTITY_REQUIRED: _omitted, ...withoutFlag } = validEnv;
    const result = runPreflight(withoutFlag);
    expect(result.status).not.toBe(0);
    expect(result.output).toMatch(/FALHA.*IDENTITY_REQUIRED/);
  });
});
