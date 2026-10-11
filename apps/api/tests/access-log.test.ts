import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { accessLogs, adminSessions, sessions, users } from "../src/db/schema";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import { newId } from "../src/lib/ids";
import {
  ACCESS_LOG_RETENTION_DAYS,
  SESSION_PURGE_GRACE_DAYS,
  purgeExpiredAccessLogs,
  purgeExpiredSessions,
  registerAccessLogJobs,
} from "../src/modules/access-log";
import { createTestHarness } from "./helpers/app";
import { cookieHeader, signInAdmin, signUp } from "./helpers/auth";

const harness = createTestHarness();
const DAY_MS = 24 * 60 * 60 * 1000;
const PASSWORD = "Senha@12345";

beforeAll(async () => {
  await registerAccessLogJobs({ db: harness.db, jobs: harness.jobs, logger: harness.deps.logger });
});

async function signIn(email: string, headers: Record<string, string> = {}) {
  const response = await harness.fetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: harness.config.WEB_ORIGIN,
      ...headers,
    },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  expect(response.status).toBe(200);
  return cookieHeader(response);
}

async function logsOf(userId: string) {
  return harness.db.select().from(accessLogs).where(eq(accessLogs.userId, userId));
}

async function insertLog(userId: string, createdAt: Date) {
  const id = newId();
  await harness.db.insert(accessLogs).values({
    id,
    userId,
    event: "login",
    ip: "198.51.100.1",
    userAgent: "teste",
    createdAt,
  });
  return id;
}

describe("registros de acesso", () => {
  it("login grava um registro login com o IP do x-forwarded-for e user agent truncado", async () => {
    const user = await signUp(harness, { email: "acesso@teste.dev" });
    await signIn(user.email, {
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "user-agent": "A".repeat(400),
    });

    const rows = await logsOf(user.userId);
    expect(rows.map((row) => row.event).sort()).toEqual(["login", "signup"]);
    const login = rows.find((row) => row.event === "login")!;
    expect(login.ip).toBe("203.0.113.7");
    expect(login.userAgent?.length).toBeLessThanOrEqual(256);
    expect(login.userAgent?.length).toBe(256);
  });

  it("logout grava um registro logout", async () => {
    const user = await signUp(harness, { email: "saida@teste.dev" });
    const cookie = await signIn(user.email);
    const response = await harness.fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN, cookie },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(200);

    const events = (await logsOf(user.userId)).map((row) => row.event).sort();
    expect(events).toEqual(["login", "logout", "signup"]);
  });

  it("exclusão de conta mantém os registros daquele userId", async () => {
    const user = await signUp(harness, { email: "exclusao@teste.dev" });
    const cookie = await signIn(user.email);

    const deleted = await harness.rpc<{ ok: boolean }>(
      "auth/deleteAccount",
      { password: PASSWORD },
      { cookie },
    );
    expect(deleted.status).toBe(200);

    const events = (await logsOf(user.userId)).map((row) => row.event).sort();
    expect(events).toEqual(["account_delete", "login", "signup"]);
    expect(await harness.db.select().from(users)).toHaveLength(0);
  });

  it("retenção apaga só registros com mais de 180 dias e sessões expiradas há mais de 30 dias", async () => {
    expect(ACCESS_LOG_RETENTION_DAYS).toBe(180);
    expect(SESSION_PURGE_GRACE_DAYS).toBe(30);
    const now = new Date();

    const old = await insertLog("usuario-antigo", new Date(now.getTime() - 181 * DAY_MS));
    const recent = await insertLog("usuario-antigo", new Date(now.getTime() - 179 * DAY_MS));
    const today = await insertLog("usuario-antigo", now);

    await purgeExpiredAccessLogs(harness.db, now);
    const remaining = (await harness.db.select().from(accessLogs)).map((row) => row.id).sort();
    expect(remaining).toEqual([recent, today].sort());
    expect(remaining).not.toContain(old);

    const user = await signUp(harness, { email: "sessoes@teste.dev" });
    const sessionFor = (expiresAt: Date) => ({
      id: newId(),
      token: newId(),
      userId: user.userId,
      expiresAt,
    });
    const expired31 = sessionFor(new Date(now.getTime() - 31 * DAY_MS));
    const expired29 = sessionFor(new Date(now.getTime() - 29 * DAY_MS));
    await harness.db.insert(sessions).values([expired31, expired29]);

    await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
    const adminExpired31 = {
      id: newId(),
      token: newId(),
      userId: DEV_ADMINS[0]!.id,
      expiresAt: new Date(now.getTime() - 31 * DAY_MS),
    };
    const adminExpired29 = { ...adminExpired31, id: newId(), token: newId() };
    adminExpired29.expiresAt = new Date(now.getTime() - 29 * DAY_MS);
    await harness.db.insert(adminSessions).values([adminExpired31, adminExpired29]);

    await purgeExpiredSessions(harness.db, now);

    const sessionIds = (await harness.db.select().from(sessions)).map((row) => row.id);
    expect(sessionIds).not.toContain(expired31.id);
    expect(sessionIds).toContain(expired29.id);
    expect(sessionIds).toHaveLength(2);
    const adminSessionIds = (await harness.db.select().from(adminSessions)).map((row) => row.id);
    expect(adminSessionIds).toEqual([adminExpired29.id]);
  });

  it("admin.accessLogs filtra por userId e período e exige sessão de admin", async () => {
    const now = Date.now();
    const target = "usuario-alvo";
    const inside = await insertLog(target, new Date(now - 2 * DAY_MS));
    await insertLog(target, new Date(now - 10 * DAY_MS));
    await insertLog("outro-usuario", new Date(now - 2 * DAY_MS));
    const input = {
      userId: target,
      from: new Date(now - 5 * DAY_MS).toISOString(),
      to: new Date(now).toISOString(),
    };

    const anonymous = await harness.rpc<{ code: string }>("admin/accessLogs", input);
    expect(anonymous.status).toBe(401);

    const user = await signUp(harness, { email: "curioso@teste.dev" });
    const asUser = await harness.rpc<{ code: string }>("admin/accessLogs", input, {
      cookie: user.cookie,
    });
    expect(asUser.status).toBe(401);

    await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
    const adminCookie = await signInAdmin(harness, DEV_ADMINS[0]!.email, DEV_ADMINS[0]!.password);
    const result = await harness.rpc<{
      items: Array<{ id: string; userId: string; event: string; ip: string | null }>;
      total: number;
      page: number;
    }>("admin/accessLogs", input, { cookie: adminCookie });
    expect(result.status).toBe(200);
    expect(result.body.total).toBe(1);
    expect(result.body.items.map((item) => item.id)).toEqual([inside]);
    expect(result.body.items[0]).toMatchObject({ userId: target, event: "login" });

    const all = await harness.rpc<{ total: number }>(
      "admin/accessLogs",
      { page: 1, pageSize: 2 },
      { cookie: adminCookie },
    );
    expect(all.status).toBe(200);
    expect(all.body.total).toBe(4);
  });
});
