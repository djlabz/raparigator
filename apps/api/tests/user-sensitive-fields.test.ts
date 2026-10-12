import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users, verificationChannels } from "../src/db/schema";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";

const harness = createTestHarness({ captureLogs: true });

const VALID_CPF = "529.982.247-25";
const OTHER_VALID_CPF = "111.444.777-35";

async function readUser(userId: string) {
  const [row] = await harness.db
    .select({
      role: users.role,
      cpf: users.cpf,
      city: users.city,
      phone: users.phone,
      phoneVerified: users.phoneVerified,
      alias: users.alias,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row!;
}

function updateUser(cookie: string, body: Record<string, unknown>) {
  return harness.fetch("/api/auth/update-user", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin: harness.config.WEB_ORIGIN,
    },
    body: JSON.stringify(body),
  });
}

function rawSignUp(body: Record<string, unknown>) {
  return harness.fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: harness.config.WEB_ORIGIN },
    body: JSON.stringify({ password: "Senha@12345", ...body }),
  });
}

describe("campos sensíveis fora do update-user", () => {
  it("(a) update-user não troca o papel", async () => {
    const client = await signUp(harness, { email: "papel@teste.dev" });
    const response = await updateUser(client.cookie, { role: "profissional" });
    expect([200, 400]).toContain(response.status);
    expect((await readUser(client.userId)).role).toBe("cliente");
  });

  it("(b) update-user não grava CPF nem cidade", async () => {
    const client = await signUp(harness, { email: "cpf-cidade@teste.dev" });
    const response = await updateUser(client.cookie, { cpf: VALID_CPF, city: "Recife, PE" });
    expect([200, 400]).toContain(response.status);
    const row = await readUser(client.userId);
    expect(row.cpf).toBeNull();
    expect(row.city).toBeNull();
  });

  it("(c) update-user não grava telefone", async () => {
    const client = await signUp(harness, { email: "fone@teste.dev" });
    const response = await updateUser(client.cookie, { phone: "11988887777" });
    expect([200, 400]).toContain(response.status);
    expect((await readUser(client.userId)).phone).toBeNull();
  });

  it("update-user continua aceitando o apelido", async () => {
    const client = await signUp(harness, { email: "apelido@teste.dev" });
    const response = await updateUser(client.cookie, { alias: "Coruja Serena" });
    expect(response.status).toBe(200);
    expect((await readUser(client.userId)).alias).toBe("Coruja Serena");
  });

  it("(d) troca de telefone zera a verificação e gera código para o número novo", async () => {
    const pro = await rawSignUp({
      email: "troca-fone@teste.dev",
      name: "Anunciante Teste",
      role: "profissional",
      phone: "11977776666",
    });
    expect(pro.status).toBe(200);
    const { user } = (await pro.json()) as { user: { id: string } };
    const cookie = (pro.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    const now = new Date();
    await harness.db.update(users).set({ phoneVerified: true }).where(eq(users.id, user.id));
    await harness.db.insert(verificationChannels).values({
      id: "canal-antigo",
      userId: user.id,
      channel: "phone",
      target: "11977776666",
      verifiedAt: now,
      updatedAt: now,
    });

    const unauthenticated = await harness.rpc("verification/changePhone", {
      phone: "21966665555",
    });
    expect(unauthenticated.status).toBe(401);

    const invalid = await harness.rpc<{ message: string }>(
      "verification/changePhone",
      { phone: "123" },
      { cookie },
    );
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe("Informe um telefone válido com DDD.");
    expect((await readUser(user.id)).phone).toBe("11977776666");

    const changed = await harness.rpc<{ expiresAt: string }>(
      "verification/changePhone",
      { phone: "21966665555" },
      { cookie },
    );
    expect(changed.status).toBe(200);
    expect(new Date(changed.body.expiresAt).getTime()).toBeGreaterThan(Date.now());

    const row = await readUser(user.id);
    expect(row.phone).toBe("21966665555");
    expect(row.phoneVerified).toBe(false);
    expect(row.role).toBe("profissional");

    const channels = await harness.db
      .select()
      .from(verificationChannels)
      .where(
        and(eq(verificationChannels.userId, user.id), eq(verificationChannels.channel, "phone")),
      );
    expect(channels).toHaveLength(1);
    expect(channels[0]?.target).toBe("21966665555");
    expect(channels[0]?.verifiedAt).toBeNull();
    expect(channels[0]?.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(channels[0]?.codeSentAt).not.toBeNull();

    const state = await harness.rpc<{ phone: { target: string; verified: boolean } }>(
      "verification/getState",
      {},
      { cookie },
    );
    expect(state.body.phone.target).toBe("21966665555");
    expect(state.body.phone.verified).toBe(false);

    const logs = harness.logs();
    expect(logs).not.toContain("21966665555");
    expect(logs).not.toContain("11977776666");
  });

  it("(e) rota de CPF e cidade valida o CPF e só altera o próprio usuário", async () => {
    const client = await signUp(harness, { email: "perfil@teste.dev" });
    const other = await signUp(harness, { email: "outro@teste.dev" });

    const unauthenticated = await harness.rpc("auth/updateProfile", { cpf: VALID_CPF });
    expect(unauthenticated.status).toBe(401);

    const invalid = await harness.rpc<{ message: string }>(
      "auth/updateProfile",
      { cpf: "529.982.247-24" },
      { cookie: client.cookie },
    );
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe("Informe um CPF válido.");

    const repeated = await harness.rpc<{ message: string }>(
      "auth/updateProfile",
      { cpf: "111.111.111-11" },
      { cookie: client.cookie },
    );
    expect(repeated.status).toBe(400);
    expect((await readUser(client.userId)).cpf).toBeNull();

    const emptyCity = await harness.rpc<{ message: string }>(
      "auth/updateProfile",
      { city: "   " },
      { cookie: client.cookie },
    );
    expect(emptyCity.status).toBe(400);
    expect(emptyCity.body.message).toBe("Informe sua cidade.");

    const withRole = await harness.rpc(
      "auth/updateProfile",
      { cpf: VALID_CPF, role: "profissional" },
      { cookie: client.cookie },
    );
    expect(withRole.status).toBe(400);
    expect((await readUser(client.userId)).role).toBe("cliente");

    const ok = await harness.rpc(
      "auth/updateProfile",
      { cpf: VALID_CPF, city: "  Recife, PE  " },
      { cookie: client.cookie },
    );
    expect(ok.status).toBe(200);
    const row = await readUser(client.userId);
    expect(row.cpf).toBe(VALID_CPF);
    expect(row.city).toBe("Recife, PE");
    expect(row.role).toBe("cliente");

    const otherRow = await readUser(other.userId);
    expect(otherRow.cpf).toBeNull();
    expect(otherRow.city).toBeNull();

    const me = await harness.rpc<{ user: { cpf?: string; city?: string } }>(
      "auth/me",
      {},
      { cookie: client.cookie },
    );
    expect(me.body.user.cpf).toBe(VALID_CPF);
    expect(me.body.user.city).toBe("Recife, PE");

    const logs = harness.logs();
    expect(logs).not.toContain(VALID_CPF);
    expect(logs).not.toContain("52998224725");
  });
});

describe("regressão: cadastro continua gravando os campos sensíveis", () => {
  it("cadastro de cliente como a tela envia grava papel, CPF, cidade e apelido", async () => {
    const response = await rawSignUp({
      email: "cliente-cadastro@teste.dev",
      name: "Cliente Cadastro",
      role: "cliente",
      cpf: VALID_CPF,
      city: "São Paulo, SP",
      alias: "Raposa Calma",
    });
    expect(response.status).toBe(200);
    const { user } = (await response.json()) as { user: { id: string } };
    const row = await readUser(user.id);
    expect(row).toMatchObject({
      role: "cliente",
      cpf: VALID_CPF,
      city: "São Paulo, SP",
      alias: "Raposa Calma",
      phoneVerified: false,
    });
  });

  it("cadastro de profissional como a tela envia grava papel, CPF e telefone", async () => {
    const response = await rawSignUp({
      email: "pro-cadastro@teste.dev",
      name: "Nome Civil",
      role: "profissional",
      cpf: OTHER_VALID_CPF,
      phone: "+55 (11) 98888-7777",
      alias: "Luna Teste",
    });
    expect(response.status).toBe(200);
    const { user } = (await response.json()) as { user: { id: string } };
    const row = await readUser(user.id);
    expect(row).toMatchObject({
      role: "profissional",
      cpf: OTHER_VALID_CPF,
      phone: "+55 (11) 98888-7777",
      alias: "Luna Teste",
      phoneVerified: false,
    });
  });

  it("cadastro sem papel cria cliente", async () => {
    const response = await rawSignUp({ email: "sem-papel@teste.dev", name: "Sem Papel" });
    expect(response.status).toBe(200);
    const { user } = (await response.json()) as { user: { id: string } };
    expect((await readUser(user.id)).role).toBe("cliente");
  });

  it("cadastro recusa CPF inválido e campo sensível que não é texto", async () => {
    const invalidCpf = await rawSignUp({
      email: "cpf-invalido@teste.dev",
      name: "CPF Inválido",
      role: "cliente",
      cpf: "123.456.789-00",
    });
    expect(invalidCpf.status).toBe(400);
    expect(((await invalidCpf.json()) as { message?: string }).message).toBe(
      "Informe um CPF válido.",
    );

    for (const field of ["cpf", "phone", "city"]) {
      const response = await rawSignUp({
        email: `tipo-${field}@teste.dev`,
        name: "Tipo Errado",
        role: "cliente",
        [field]: 12345678909,
      });
      expect(response.status).toBe(400);
    }

    const created = await harness.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, "cpf-invalido@teste.dev"));
    expect(created).toHaveLength(0);
  });
});
