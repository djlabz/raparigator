import { describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { CLIENT_ALIAS_PATTERN, CLIENT_ALIAS_TAKEN_MESSAGE } from "@sigillus/domain";
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

  it("cadastro de cliente sem apelido gera alias único", async () => {
    const people = [
      { email: "joana.prado@teste.dev", name: "Joana Prado", phone: "11987654321" },
      { email: "rui.bastos@teste.dev", name: "Rui Bastos", phone: "21912345678" },
    ];
    const aliases: string[] = [];
    for (const person of people) {
      const response = await harness.fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
        body: JSON.stringify({ ...person, password: "Senha@12345", role: "cliente" }),
      });
      expect(response.ok).toBe(true);
      const [row] = await harness.db
        .select({ alias: schema.users.alias })
        .from(schema.users)
        .where(eq(schema.users.email, person.email));
      const alias = row?.alias ?? "";
      expect(alias).toMatch(CLIENT_ALIAS_PATTERN);
      const lower = alias.toLowerCase();
      for (const part of [...person.name.split(" "), person.email.split("@")[0]!, person.phone]) {
        expect(lower).not.toContain(part.toLowerCase());
      }
      aliases.push(alias);
    }
    expect(aliases[0]).not.toBe(aliases[1]);

    const pro = await signUp(harness, { email: "sem-alias-pro@teste.dev", role: "profissional" });
    const [proRow] = await harness.db
      .select({ alias: schema.users.alias })
      .from(schema.users)
      .where(eq(schema.users.id, pro.userId));
    expect(proRow?.alias ?? null).toBeNull();
  });

  it("apelido duplicado é recusado no cadastro e na edição, sem diferenciar maiúsculas", async () => {
    const first = await signUp(harness, { email: "alias-a@teste.dev", alias: "Lobo Discreto" });

    const duplicated = await harness.fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({
        email: "alias-b@teste.dev",
        password: "Senha@12345",
        name: "Outra Pessoa",
        role: "cliente",
        alias: "lobo discreto",
      }),
    });
    expect(duplicated.ok).toBe(false);
    expect(((await duplicated.json()) as { message?: string }).message).toBe(
      CLIENT_ALIAS_TAKEN_MESSAGE,
    );

    const second = await signUp(harness, { email: "alias-c@teste.dev" });
    const update = (cookie: string, alias: string) =>
      harness.fetch("/api/auth/update-user", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: harness.config.WEB_ORIGIN,
          cookie,
        },
        body: JSON.stringify({ alias }),
      });

    const taken = await update(second.cookie, "LOBO DISCRETO");
    expect(taken.ok).toBe(false);
    expect(((await taken.json()) as { message?: string }).message).toBe(CLIENT_ALIAS_TAKEN_MESSAGE);

    expect((await update(second.cookie, "Coruja Atenta")).ok).toBe(true);
    expect((await update(first.cookie, "lobo discreto")).ok).toBe(true);

    const rows = await harness.db
      .select({ id: schema.users.id, alias: schema.users.alias })
      .from(schema.users)
      .where(inArray(schema.users.id, [first.userId, second.userId]));
    const byId = new Map(rows.map((row) => [row.id, row.alias]));
    expect(byId.get(first.userId)).toBe("lobo discreto");
    expect(byId.get(second.userId)).toBe("Coruja Atenta");
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
    const res = await harness.rpc("auth/deleteAccount", { password: "Senha@12345" });
    expect(res.status).toBe(401);
  });

  it("auth.deleteAccount apaga mídias do storage, anonimiza mensagens enviadas e remove usuário", async () => {
    const fx = await createDeletionFixture("del");

    const deleteRes = await harness.rpc<{ ok: boolean }>(
      "auth/deleteAccount",
      { password: "Senha@12345" },
      { cookie: fx.client.cookie },
    );
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({ ok: true });

    expect(harness.storage.objects.has(fx.mediaKey)).toBe(false);

    const [msgAfter] = await harness.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, fx.msgId));
    expect(msgAfter).toBeDefined();
    expect(msgAfter!.senderUserId).toBe(fx.client.userId);
    expect(msgAfter!.content).toBe("[Mensagem apagada devido à exclusão da conta]");

    const [convAfter] = await harness.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, fx.convId));
    expect(convAfter).toBeDefined();
    expect(convAfter!.lastMessagePreview).toBe("[Mensagem apagada]");

    const meRes = await harness.rpc<{ user: null }>("auth/me", {}, { cookie: fx.client.cookie });
    expect(meRes.body).toEqual({ user: null });

    const loginRes = await harness.fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
      body: JSON.stringify({ email: fx.client.email, password: "Senha@12345" }),
    });
    expect(loginRes.ok).toBe(false);
  });

  it("auth.deleteAccount com senha errada não apaga nada", async () => {
    const fx = await createDeletionFixture("wrong");

    const deleteRes = await harness.rpc<{ message: string }>(
      "auth/deleteAccount",
      { password: "errada" },
      { cookie: fx.client.cookie },
    );
    expect(deleteRes.status).toBe(400);
    expect(deleteRes.body.message).toBe("Senha incorreta.");

    const [userAfter] = await harness.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, fx.client.userId));
    expect(userAfter).toBeDefined();

    expect(harness.storage.objects.has(fx.mediaKey)).toBe(true);
    const [assetAfter] = await harness.db
      .select()
      .from(schema.mediaAssets)
      .where(eq(schema.mediaAssets.id, fx.assetId));
    expect(assetAfter).toBeDefined();

    const [msgAfter] = await harness.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, fx.msgId));
    expect(msgAfter!.content).toBe(fx.originalContent);

    const [convAfter] = await harness.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, fx.convId));
    expect(convAfter!.lastMessagePreview).toBe(fx.originalContent);

    const meRes = await harness.rpc<{ user: { id: string } }>(
      "auth/me",
      {},
      { cookie: fx.client.cookie },
    );
    expect(meRes.body.user.id).toBe(fx.client.userId);
  });

  it("auth.deleteAccount com sessão antiga e senha certa exclui a conta", async () => {
    const fx = await createDeletionFixture("old");

    await harness.db
      .update(schema.sessions)
      .set({ createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) })
      .where(eq(schema.sessions.userId, fx.client.userId));

    const deleteRes = await harness.rpc<{ ok: boolean }>(
      "auth/deleteAccount",
      { password: "Senha@12345" },
      { cookie: fx.client.cookie },
    );
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({ ok: true });

    const meRes = await harness.rpc<{ user: null }>("auth/me", {}, { cookie: fx.client.cookie });
    expect(meRes.body).toEqual({ user: null });

    const [msgAfter] = await harness.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.id, fx.msgId));
    expect(msgAfter!.content).toBe("[Mensagem apagada devido à exclusão da conta]");

    const [convAfter] = await harness.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, fx.convId));
    expect(convAfter!.lastMessagePreview).toBe("[Mensagem apagada]");

    expect(harness.storage.objects.has(fx.mediaKey)).toBe(false);
  });

  it("auth.deleteAccount sem senha é erro de validação", async () => {
    const client = await signUp(harness, { email: "nopass@teste.dev" });

    const deleteRes = await harness.rpc("auth/deleteAccount", {}, { cookie: client.cookie });
    expect(deleteRes.status).toBe(400);

    const meRes = await harness.rpc<{ user: { id: string } }>(
      "auth/me",
      {},
      { cookie: client.cookie },
    );
    expect(meRes.body.user.id).toBe(client.userId);
  });

  it("auth.deleteAccount de profissional com senha certa exclui a conta", async () => {
    const pro = await signUp(harness, { email: "pro-del@teste.dev", role: "profissional" });
    await harness.db.insert(schema.professionalProfiles).values({
      id: "prof-del-only",
      userId: pro.userId,
      slug: "pro-del-only",
      displayName: "Pro Del",
      artisticName: "Pro Del",
      city: "São Paulo",
      state: "SP",
    });

    const deleteRes = await harness.rpc<{ ok: boolean }>(
      "auth/deleteAccount",
      { password: "Senha@12345" },
      { cookie: pro.cookie },
    );
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body).toEqual({ ok: true });

    const meRes = await harness.rpc<{ user: null }>("auth/me", {}, { cookie: pro.cookie });
    expect(meRes.body).toEqual({ user: null });
  });
});

async function createDeletionFixture(prefix: string) {
  const client = await signUp(harness, {
    email: `${prefix}-client@teste.dev`,
    password: "Senha@12345",
  });
  const pro = await signUp(harness, { email: `${prefix}-pro@teste.dev`, role: "profissional" });

  const mediaKey = `users/${client.userId}/foto.jpg`;
  await harness.storage.putObject(mediaKey, new Uint8Array([1, 2, 3]), "image/jpeg");
  expect(harness.storage.objects.has(mediaKey)).toBe(true);

  const assetId = `${prefix}-asset-1`;
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

  const profileId = `${prefix}-prof-1`;
  await harness.db.insert(schema.professionalProfiles).values({
    id: profileId,
    userId: pro.userId,
    slug: `${prefix}-pro-teste`,
    displayName: "Pro Teste",
    artisticName: "Pro Teste",
    city: "São Paulo",
    state: "SP",
  });

  const originalContent = "Olá, tenho uma pergunta pessoal";
  const convId = `${prefix}-conv-1`;
  await harness.db.insert(schema.conversations).values({
    id: convId,
    profileId,
    clientUserId: client.userId,
    professionalUserId: pro.userId,
    lastMessagePreview: originalContent,
  });

  await harness.db.insert(schema.conversationParticipants).values([
    { id: `${prefix}-part-1`, conversationId: convId, userId: client.userId, role: "cliente" },
    { id: `${prefix}-part-2`, conversationId: convId, userId: pro.userId, role: "profissional" },
  ]);

  const msgId = `${prefix}-msg-1`;
  await harness.db.insert(schema.messages).values({
    id: msgId,
    conversationId: convId,
    senderUserId: client.userId,
    senderRole: "cliente",
    messageType: "text",
    content: originalContent,
  });

  return { client, pro, mediaKey, assetId, convId, msgId, originalContent };
}
