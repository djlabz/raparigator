import { describe, expect, it } from "vitest";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import { createTestHarness } from "./helpers/app";
import { signInAdmin, signUp } from "./helpers/auth";

const harness = createTestHarness();

describe("autenticação e sessão", () => {
  it("auth.me devolve null sem sessão", async () => {
    const result = await harness.rpc<{ user: null }>("auth/me");
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ user: null });
  });

  it("cadastro por e-mail cria sessão e auth.me reflete o papel", async () => {
    const pro = await signUp(harness, { email: "pro@teste.dev", role: "profissional" });
    const me = await harness.rpc<{ user: { role: string; email: string; plan?: string } }>(
      "auth/me",
      {},
      { cookie: pro.cookie },
    );
    expect(me.status).toBe(200);
    expect(me.body.user.role).toBe("profissional");
    expect(me.body.user.email).toBe("pro@teste.dev");
    expect(me.body.user.plan).toBe("standard");
  });

  it("papel só aceita cliente ou profissional", async () => {
    const response = await harness.fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({
        email: "hack@teste.dev",
        password: "Senha@12345",
        name: "Hacker",
        role: "admin",
      }),
    });
    expect(response.ok).toBe(false);
  });

  it("sessão de admin é isolada da sessão de usuário", async () => {
    await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
    const adminCookie = await signInAdmin(harness, DEV_ADMINS[0]!.email, DEV_ADMINS[0]!.password);
    expect(adminCookie).toContain("sigillus-admin");
    const me = await harness.rpc<{ user: null }>("auth/me", {}, { cookie: adminCookie });
    expect(me.body).toEqual({ user: null });

    const userSignUp = await signUp(harness, { email: "cli@teste.dev" });
    const userSession = await harness.fetch("/api/admin-auth/get-session", {
      headers: { cookie: userSignUp.cookie },
    });
    expect(await userSession.json()).toBeNull();
  });

  it("admin sign-up é desabilitado", async () => {
    const response = await harness.fetch("/api/admin-auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ email: "novo@admin.dev", password: "Senha@12345", name: "Novo" }),
    });
    expect(response.ok).toBe(false);
  });

  it("recuperação de senha envia e-mail com token e permite redefinir com sucesso", async () => {
    await signUp(harness, { email: "reset@teste.dev", password: "SenhaAntiga@123" });

    const forgetResponse = await harness.fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ email: "reset@teste.dev" }),
    });
    expect(forgetResponse.ok).toBe(true);
    expect(harness.mailer.sent).toHaveLength(1);

    const emailSent = harness.mailer.sent[0]!;
    expect(emailSent.to).toBe("reset@teste.dev");
    expect(emailSent.subject).toContain("Redefinição de senha");

    const match = emailSent.text.match(/token=([a-zA-Z0-9_-]+)/);
    expect(match).not.toBeNull();
    const token = match![1];

    const resetResponse = await harness.fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ token, newPassword: "SenhaNova@456" }),
    });
    expect(resetResponse.ok).toBe(true);

    const oldLoginResponse = await harness.fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ email: "reset@teste.dev", password: "SenhaAntiga@123" }),
    });
    expect(oldLoginResponse.ok).toBe(false);

    const newLoginResponse = await harness.fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ email: "reset@teste.dev", password: "SenhaNova@456" }),
    });
    expect(newLoginResponse.ok).toBe(true);
  });
});
