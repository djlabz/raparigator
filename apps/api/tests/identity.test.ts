import { eq } from "drizzle-orm";
import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type {
  IdentityVerificationFiles,
  IdentityVerificationMine,
  IdentityVerificationSummary,
  IdentityVerificationUploadOutput,
} from "@sigillus/contracts";
import { identityVerifications, professionalProfiles } from "../src/db/schema";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import { createAnnouncementsService } from "../src/modules/announcements";
import {
  ADMIN_IDENTITY_DIGEST_JOB,
  IDENTITY_FILES_RETENTION_DAYS,
  createIdentityService,
  purgeExpiredIdentityFiles,
  registerAdminIdentityDigestJob,
  registerIdentityJobs,
} from "../src/modules/identity";
import { createTestHarness } from "./helpers/app";
import { signInAdmin, signUp } from "./helpers/auth";
import { completeDraft } from "./helpers/drafts";

const ADMIN_EMAIL = "identidade@sigillus.test";
const CIVIL_NAME = "Nome Civil Reservado";
const DAY_MS = 24 * 60 * 60 * 1000;

const harness = createTestHarness({ captureLogs: true });

function services(identityRequired: boolean) {
  const identity = createIdentityService({
    db: harness.db,
    storage: harness.storage,
    jobs: harness.jobs,
    logger: harness.deps.logger,
    config: { ...harness.config, IDENTITY_REQUIRED: identityRequired },
  });
  const announcements = createAnnouncementsService({
    db: harness.db,
    profiles: harness.deps.services.profiles,
    jobs: harness.jobs,
    logger: harness.deps.logger,
    identityGate: (userId) => identity.publishGate(userId),
  });
  return { identity, announcements };
}

async function professional(tag: string) {
  const user = await signUp(harness, {
    email: `pro-${tag}@identidade.dev`,
    role: "profissional",
    name: CIVIL_NAME,
    alias: `Luna ${tag}`,
  });
  return { ...user, owner: { id: user.userId, name: CIVIL_NAME, alias: `Luna ${tag}` } };
}

async function jpegWithGps() {
  return sharp({ create: { width: 64, height: 48, channels: 3, background: "#aa3355" } })
    .jpeg()
    .withExif({
      IFD0: { Make: "CameraTeste" },
      IFD3: { GPSLatitudeRef: "S", GPSLatitude: "23/1 33/1 0/1" },
    })
    .toBuffer();
}

async function upload(cookie: string, kind: "document" | "selfie") {
  const bytes = await jpegWithGps();
  const created = await harness.rpc<IdentityVerificationUploadOutput>(
    "identity/createUpload",
    { kind, contentType: "image/jpeg", sizeBytes: bytes.byteLength },
    { cookie },
  );
  expect(created.status).toBe(200);
  await harness.storage.putObject(created.body.key, new Uint8Array(bytes), "image/jpeg");
  return created.body.key;
}

async function submitVerification(cookie: string) {
  const documentKey = await upload(cookie, "document");
  const selfieKey = await upload(cookie, "selfie");
  const response = await harness.rpc<IdentityVerificationMine>(
    "identity/submit",
    { documentKey, selfieKey },
    { cookie },
  );
  expect(response.status).toBe(200);
  return { documentKey, selfieKey, mine: response.body };
}

async function rowsOf(userId: string) {
  return harness.db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.userId, userId))
    .orderBy(identityVerifications.createdAt);
}

async function adminCookie() {
  await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
  return signInAdmin(harness, DEV_ADMINS[0]!.email, DEV_ADMINS[0]!.password);
}

async function pendingIdOf(userId: string) {
  const rows = await rowsOf(userId);
  return rows.find((row) => row.status === "pending")!.id;
}

beforeAll(async () => {
  await registerIdentityJobs({
    db: harness.db,
    storage: harness.storage,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
  await registerAdminIdentityDigestJob({
    db: harness.db,
    config: { ...harness.config, ADMIN_NOTIFY_EMAIL: ADMIN_EMAIL },
    mailer: harness.mailer,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
});

beforeEach(() => {
  harness.jobs.enqueued.length = 0;
  harness.jobs.clearDelayed();
});

describe("verificação de identidade da anunciante", () => {
  it("(a) com IDENTITY_REQUIRED=true, publicar sem verificação aprovada devolve identity_required em PT-BR", async () => {
    const pro = await professional("a");
    const { announcements } = services(true);
    await announcements.getMine(pro.owner);
    harness.jobs.enqueued.length = 0;

    const result = await announcements.publish(pro.owner, completeDraft());

    expect(result).toMatchObject({ ok: false, reason: "identity_required" });
    expect(result.ok ? "" : result.message).toMatch(/verificação de identidade/i);
    const [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, pro.userId));
    expect(profile!.submittedAt).toBeNull();
    expect(harness.jobs.enqueued.map((job) => job.name)).not.toContain("admin.review-digest");
    expect(harness.jobs.delayed.map((job) => job.name)).not.toContain("admin.review-digest");

    await submitVerification(pro.cookie);
    const pending = await announcements.publish(pro.owner, completeDraft());
    expect(pending).toMatchObject({ ok: false, reason: "identity_required" });
  });

  it("(a2) com IDENTITY_REQUIRED=false, publicar segue sem verificação", async () => {
    const pro = await professional("a2");
    const { announcements } = services(false);
    const result = await announcements.publish(pro.owner, completeDraft());
    expect(result).toEqual({ ok: true });
  });

  it("(b) admin aprova e a publicação passa, com perfil pending_review e submittedAt", async () => {
    const pro = await professional("b");
    const admin = await adminCookie();
    const { announcements } = services(true);
    const submitted = await submitVerification(pro.cookie);
    expect(submitted.mine).toMatchObject({ status: "pending", rejectReason: null });

    const approved = await harness.rpc(
      "admin/approveIdentity",
      { id: await pendingIdOf(pro.userId) },
      { cookie: admin },
    );
    expect(approved.status).toBe(200);
    const [row] = await rowsOf(pro.userId);
    expect(row).toMatchObject({ status: "approved", reviewedBy: DEV_ADMINS[0]!.email });
    expect(row!.reviewedAt).toBeInstanceOf(Date);

    const result = await announcements.publish(pro.owner, completeDraft());
    expect(result).toEqual({ ok: true });
    const [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, pro.userId));
    expect(profile!.verificationStatus).toBe("pending_review");
    expect(profile!.submittedAt).toBeInstanceOf(Date);
  });

  it("(c) reprovar com motivo: anunciante lê o motivo e o reenvio cria registro novo pendente", async () => {
    const pro = await professional("c");
    const admin = await adminCookie();
    await submitVerification(pro.cookie);
    const id = await pendingIdOf(pro.userId);

    const rejected = await harness.rpc(
      "admin/rejectIdentity",
      { id, reason: "Documento ilegível" },
      { cookie: admin },
    );
    expect(rejected.status).toBe(200);

    const mine = await harness.rpc<IdentityVerificationMine>(
      "identity/getMine",
      {},
      { cookie: pro.cookie },
    );
    expect(mine.status).toBe(200);
    expect(mine.body).toMatchObject({ status: "rejected", rejectReason: "Documento ilegível" });
    expect(JSON.stringify(mine.body)).not.toContain("private/identity");

    const again = await submitVerification(pro.cookie);
    expect(again.mine).toMatchObject({ status: "pending", rejectReason: null });
    const rows = await rowsOf(pro.userId);
    expect(rows.map((row) => row.status)).toEqual(["rejected", "pending"]);
  });

  it("(c2) submit limpa EXIF/GPS, recusa chave de outro usuário e segundo envio com verificação ativa", async () => {
    const pro = await professional("c2");
    const other = await professional("c2-outra");
    const { documentKey, selfieKey } = await submitVerification(pro.cookie);
    for (const key of [documentKey, selfieKey]) {
      expect(key.startsWith(`private/identity/${pro.userId}/`)).toBe(true);
      const stored = harness.storage.objects.get(key)!;
      const metadata = await sharp(Buffer.from(stored.body)).metadata();
      expect(metadata.exif).toBeUndefined();
    }

    const foreign = await harness.rpc(
      "identity/submit",
      { documentKey, selfieKey },
      { cookie: other.cookie },
    );
    expect(foreign.status).toBe(403);

    const duplicate = await harness.rpc(
      "identity/createUpload",
      { kind: "document", contentType: "image/jpeg", sizeBytes: 1000 },
      { cookie: pro.cookie },
    );
    expect(duplicate.status).toBe(409);
  });

  it("(d) URL do documento: 401 sem sessão, 403 para a própria anunciante, URL assinada para o admin", async () => {
    const pro = await professional("d");
    const admin = await adminCookie();
    await submitVerification(pro.cookie);
    const id = await pendingIdOf(pro.userId);

    const anonymous = await harness.rpc("admin/identityFileUrl", { id });
    expect(anonymous.status).toBe(401);
    const owner = await harness.rpc("admin/identityFileUrl", { id }, { cookie: pro.cookie });
    expect(owner.status).toBe(403);
    const ownerList = await harness.rpc("admin/identityVerifications", {}, { cookie: pro.cookie });
    expect(ownerList.status).toBe(403);

    const files = await harness.rpc<IdentityVerificationFiles>(
      "admin/identityFileUrl",
      { id },
      { cookie: admin },
    );
    expect(files.status).toBe(200);
    expect(files.body.documentUrl).toContain("signed=1");
    expect(files.body.selfieUrl).toContain("signed=1");

    const list = await harness.rpc<IdentityVerificationSummary[]>(
      "admin/identityVerifications",
      { status: "pending" },
      { cookie: admin },
    );
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ id, userId: pro.userId, filesAvailable: true });
    expect(JSON.stringify(list.body)).not.toContain(CIVIL_NAME);
    expect(JSON.stringify(list.body)).not.toContain("private/identity");
  });

  it(`(e) retenção apaga os arquivos ${IDENTITY_FILES_RETENTION_DAYS} dias após a aprovação e mantém o registro`, async () => {
    const old = await professional("e-antiga");
    const recent = await professional("e-recente");
    const admin = await adminCookie();
    const oldFiles = await submitVerification(old.cookie);
    const recentFiles = await submitVerification(recent.cookie);
    for (const user of [old, recent]) {
      await harness.rpc(
        "admin/approveIdentity",
        { id: await pendingIdOf(user.userId) },
        { cookie: admin },
      );
    }
    const now = new Date();
    await harness.db
      .update(identityVerifications)
      .set({ reviewedAt: new Date(now.getTime() - 31 * DAY_MS) })
      .where(eq(identityVerifications.userId, old.userId));
    await harness.db
      .update(identityVerifications)
      .set({ reviewedAt: new Date(now.getTime() - 29 * DAY_MS) })
      .where(eq(identityVerifications.userId, recent.userId));

    const purged = await purgeExpiredIdentityFiles(
      { db: harness.db, storage: harness.storage, logger: harness.deps.logger },
      now,
    );
    expect(purged).toBe(1);

    expect(harness.storage.objects.has(oldFiles.documentKey)).toBe(false);
    expect(harness.storage.objects.has(oldFiles.selfieKey)).toBe(false);
    const [oldRow] = await rowsOf(old.userId);
    expect(oldRow).toMatchObject({
      status: "approved",
      documentKey: null,
      selfieKey: null,
      reviewedBy: DEV_ADMINS[0]!.email,
    });
    expect(oldRow!.reviewedAt).toBeInstanceOf(Date);
    expect(oldRow!.filesDeletedAt).toBeInstanceOf(Date);

    expect(harness.storage.objects.has(recentFiles.documentKey)).toBe(true);
    expect(harness.storage.objects.has(recentFiles.selfieKey)).toBe(true);
    const [recentRow] = await rowsOf(recent.userId);
    expect(recentRow).toMatchObject({
      status: "approved",
      documentKey: recentFiles.documentKey,
      selfieKey: recentFiles.selfieKey,
      filesDeletedAt: null,
    });
  });

  it("(g) reprovar apaga documento e selfie na hora e mantém o registro", async () => {
    const pro = await professional("g");
    const admin = await adminCookie();
    const { documentKey, selfieKey } = await submitVerification(pro.cookie);
    await harness.rpc(
      "admin/rejectIdentity",
      { id: await pendingIdOf(pro.userId), reason: "Selfie não confere com o documento" },
      { cookie: admin },
    );
    expect(harness.storage.objects.has(documentKey)).toBe(false);
    expect(harness.storage.objects.has(selfieKey)).toBe(false);
    const [row] = await rowsOf(pro.userId);
    expect(row).toMatchObject({
      status: "rejected",
      rejectReason: "Selfie não confere com o documento",
      documentKey: null,
      selfieKey: null,
      reviewedBy: DEV_ADMINS[0]!.email,
    });
    expect(row!.filesDeletedAt).toBeInstanceOf(Date);
  });

  it("(h) excluir a conta da anunciante apaga os objetos de private/identity/<userId>/", async () => {
    const pro = await professional("h");
    const { documentKey, selfieKey } = await submitVerification(pro.cookie);
    const deleted = await harness.rpc(
      "auth/deleteAccount",
      { password: "Senha@12345" },
      { cookie: pro.cookie },
    );
    expect(deleted.status).toBe(200);
    const leftovers = [...harness.storage.objects.keys()].filter((key) =>
      key.startsWith(`private/identity/${pro.userId}/`),
    );
    expect(leftovers).toEqual([]);
    expect(harness.storage.objects.has(documentKey)).toBe(false);
    expect(harness.storage.objects.has(selfieKey)).toBe(false);
    expect(await rowsOf(pro.userId)).toEqual([]);
  });

  it("verificação nova agenda e-mail ao admin só com contagem e link, sem dado pessoal em log", async () => {
    const pro = await professional("mail");
    await submitVerification(pro.cookie);
    expect(harness.jobs.delayed.map((job) => job.name)).toContain(ADMIN_IDENTITY_DIGEST_JOB);

    await harness.jobs.runDelayed();
    const mails = harness.mailer.sent.filter((mail) => mail.to === ADMIN_EMAIL);
    expect(mails).toHaveLength(1);
    expect(mails[0]!.kind).toBe("admin-notify");
    expect(mails[0]!.text).toContain(`${harness.config.WEB_ORIGIN}/admin/verificacoes`);
    expect(mails[0]!.text).not.toContain(CIVIL_NAME);
    expect(mails[0]!.text).not.toContain("Luna mail");
    expect(mails[0]!.text).not.toContain(pro.email);

    const logs = harness.logs();
    expect(logs).not.toContain(CIVIL_NAME);
    expect(logs).not.toContain("Luna mail");
    expect(logs).not.toContain(pro.email);
  });

  it("cliente não envia verificação de identidade", async () => {
    const client = await signUp(harness, { email: "cliente@identidade.dev", role: "cliente" });
    const response = await harness.rpc(
      "identity/createUpload",
      { kind: "document", contentType: "image/jpeg", sizeBytes: 1000 },
      { cookie: client.cookie },
    );
    expect(response.status).toBe(403);
  });
});
