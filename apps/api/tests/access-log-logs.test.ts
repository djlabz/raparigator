import { beforeAll, describe, expect, it } from "vitest";
import { registerAccessLogJobs } from "../src/modules/access-log";
import { createTestHarness } from "./helpers/app";

const harness = createTestHarness({ captureLogs: true });

beforeAll(async () => {
  await registerAccessLogJobs({ db: harness.db, jobs: harness.jobs, logger: harness.deps.logger });
});

const NAME = "Joana Registro Sigilosa";
const EMAIL = "joana.registro@teste.dev";
const PHONE = "+5511987650123";
const PASSWORD = "Senha@12345";

describe("logs sem dado pessoal", () => {
  it("cadastro e login não emitem e-mail, telefone nem nome, mas registram o evento", async () => {
    const headers = { "content-type": "application/json", origin: harness.config.WEB_ORIGIN };
    const signup = await harness.fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
        name: NAME,
        phone: PHONE,
        role: "cliente",
      }),
    });
    expect(signup.status).toBe(200);

    const signin = await harness.fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { ...headers, "x-forwarded-for": "203.0.113.9" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    expect(signin.status).toBe(200);

    const output = harness.logs();
    expect(output).not.toContain(EMAIL);
    expect(output).not.toContain(PHONE);
    expect(output).not.toContain("11987650123");
    expect(output).not.toContain(NAME);
    expect(output).not.toContain("203.0.113.9");
    expect(output).toContain('"event":"login"');
  });
});
