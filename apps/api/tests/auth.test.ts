import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import * as schema from "../src/db/schema";
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

  it("auth.deleteAccount exige autenticação", async () => {
    const res = await harness.rpc("auth/deleteAccount");
    expect(res.status).toBe(401);
  });

  it("auth.deleteAccount apaga mídias do storage, anonimiza mensagens enviadas e remove usuário", async () => {
    const client = await signUp(harness, {
      email: "del-client@teste.dev",
      password: "Senha@12345",
    });
    const pro = await signUp(harness, { email: "del-pro@teste.dev", role: "profissional" });

    const mediaKey = `users/${client.userId}/foto.jpg`;
    await harness.storage.putObject(mediaKey, new Uint8Array([1, 2, 3]), "image/jpeg");
    expect(harness.storage.objects.has(mediaKey)).toBe(true);

    const assetId = "asset-test-1";
    await harness.db.insert(schema.mediaAssets).values({
      id: assetId,
      ownerUserId: client.userId,
      kind: "image",
      purpose: "profile",
      status: "ready",
      contentType: "image/jpeg",
      sizeBytes: 3,
      storageKey: mediaKey,
    });

    const profileId = "prof-test-1";
    await harness.db.insert(schema.professionalProfiles).values({
      id: profileId,
      userId: pro.userId,
      slug: "pro-del-teste",
      displayName: "Pro Teste",
      artisticName: "Pro Teste",
      city: "São Paulo",
      state: "SP",
    });

    const convId = "conv-test-1";
    await harness.db.insert(schema.conversations).values({
      id: convId,
      profileId,
      clientUserId: client.userId,
      professionalUserId: pro.userId,
      lastMessagePreview: "Olá, tenho uma pergunta pessoal",
    });

    await harness.db.insert(schema.conversationParticipants).values([
      { id: "part-1", conversationId: convId, userId: client.userId, role: "cliente" },
      { id: "part-2", conversationId: convId, userId: pro.userId, role: "profissional" },
    ]);

    const msgId = "msg-test-1";
    await harness.db.insert(schema.messages).values({
      id: msgId,
      conversationId: convId,
      senderUserId: client.userId,
      senderRole: "cliente",
      messageType: "text",
      content: "Olá, tenho uma pergunta pessoal",
    });

    const deleteRes = await harness.rpc<{ ok: boolean }>(
      "auth/deleteAccount",
      {},
      { cookie: client.cookie },
    );
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({ ok: true });

    expect(harness.storage.objects.has(mediaKey)).toBe(false);

    const [msgAfter] = await harness.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, msgId));
    expect(msgAfter).toBeDefined();
    expect(msgAfter!.senderUserId).toBe(client.userId);
    expect(msgAfter!.content).toBe("[Mensagem apagada devido à exclusão da conta]");

    const [convAfter] = await harness.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, convId));
    expect(convAfter).toBeDefined();
    expect(convAfter!.lastMessagePreview).toBe("[Mensagem apagada]");

    const meRes = await harness.rpc<{ user: null }>("auth/me", {}, { cookie: client.cookie });
    expect(meRes.body).toEqual({ user: null });

    const loginRes = await harness.fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ email: "del-client@teste.dev", password: "Senha@12345" }),
    });
    expect(loginRes.ok).toBe(false);
  });
});
