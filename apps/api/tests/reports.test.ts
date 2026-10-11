import { eq } from "drizzle-orm";
import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  blockedImageHashes,
  mediaAssets,
  professionalProfiles,
  reportEvidence,
  reports,
} from "../src/db/schema";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import { registerMediaJobs } from "../src/modules/media";
import { storageKeyFor } from "../src/modules/media/service";
import {
  ADMIN_REPORT_DIGEST_JOB,
  PUBLIC_REPORT_RATE_LIMIT,
  registerAdminReportDigestJob,
} from "../src/modules/reports";
import { createTestHarness } from "./helpers/app";
import { signInAdmin, signUp } from "./helpers/auth";
import { createChatFixture, createPublishedProfile } from "./helpers/conversations";

const ADMIN_EMAIL = "denuncias@sigillus.test";
const CONTACT_EMAIL = "quem-denuncia@contato.dev";

const harness = createTestHarness({ captureLogs: true });

let ipCounter = 0;

function nextIp() {
  ipCounter += 1;
  return `198.51.100.${ipCounter}`;
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function smoothNoiseJpeg(seed: number) {
  const random = mulberry32(seed);
  const raw = Buffer.alloc(12 * 9 * 3);
  for (let index = 0; index < raw.length; index += 1) {
    raw[index] = Math.floor(random() * 256);
  }
  return sharp(raw, { raw: { width: 12, height: 9, channels: 3 } })
    .resize(640, 480, { kernel: "cubic", fit: "fill" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function resizedAndRecompressed(bytes: Buffer) {
  return sharp(bytes).resize(576, 432, { fit: "fill" }).jpeg({ quality: 60 }).toBuffer();
}

async function flatJpeg(r: number, g: number, b: number) {
  return sharp({ create: { width: 640, height: 480, channels: 3, background: { r, g, b } } })
    .jpeg()
    .toBuffer();
}

async function professionalWithProfile(tag: string) {
  const user = await signUp(harness, {
    email: `pro-${tag}@test.dev`,
    role: "profissional",
    name: "Nome Civil Pro",
    alias: `Luna ${tag}`,
  });
  const profile = await createPublishedProfile(harness, user.userId, { slug: `luna-${tag}` });
  return { userId: user.userId, ...profile };
}

async function uploadImage(userId: string, bytes: Buffer) {
  const media = harness.deps.services.media;
  const created = await media.createUpload(userId, {
    kind: "image",
    purpose: "gallery",
    contentType: "image/jpeg",
    sizeBytes: bytes.byteLength,
  });
  const key = storageKeyFor(userId, created.asset.id, "image/jpeg", "gallery");
  await harness.storage.putObject(key, new Uint8Array(bytes), "image/jpeg");
  return media.completeUpload(userId, created.asset.id);
}

async function adminCookie() {
  await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
  return signInAdmin(harness, DEV_ADMINS[0]!.email, DEV_ADMINS[0]!.password);
}

type CreatePublicOutput = {
  reportId: string;
  responseSlaHours: number;
  evidenceUploads: Array<{ uploadUrl: string; method: string; expiresAt: string }>;
};

async function createPublicReport(input: Record<string, unknown>, ip = nextIp()) {
  return harness.rpc<CreatePublicOutput>(
    "reports/createPublic",
    {
      reason: "photo_without_consent",
      details: "Foto publicada sem o meu consentimento.",
      ...input,
    },
    { "x-forwarded-for": `${ip}, 10.0.0.1` },
  );
}

async function reportRow(id: string) {
  const [row] = await harness.db.select().from(reports).where(eq(reports.id, id));
  return row!;
}

async function assetRow(id: string) {
  const [row] = await harness.db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
  return row!;
}

beforeAll(async () => {
  await registerMediaJobs({
    db: harness.db,
    storage: harness.storage,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
  await registerAdminReportDigestJob({
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

describe("canal de denúncia e retirada", () => {
  it("(a) denúncia pública grava source=public e agenda o e-mail ao admin sem o contato", async () => {
    const pro = await professionalWithProfile("a");
    harness.jobs.enqueued.length = 0;
    const ip = nextIp();
    const response = await createPublicReport(
      {
        profileSlug: pro.slug,
        reason: "minor",
        details: "Anúncio parece mostrar pessoa menor de idade.",
        contactEmail: CONTACT_EMAIL,
      },
      ip,
    );
    expect(response.status).toBe(200);
    expect(response.body.responseSlaHours).toBe(48);
    expect(response.body.evidenceUploads).toEqual([]);

    const row = await reportRow(response.body.reportId);
    expect(row).toMatchObject({
      source: "public",
      reason: "minor",
      status: "pending",
      contactEmail: CONTACT_EMAIL,
      targetProfileId: pro.id,
      profileSlug: pro.slug,
      reporterUserId: null,
    });

    expect(harness.jobs.delayed.map((job) => job.name)).toContain(ADMIN_REPORT_DIGEST_JOB);
    expect(harness.jobs.enqueued.map((job) => job.name)).not.toContain("access-log.record");

    await harness.jobs.runDelayed();
    const mails = harness.mailer.sent.filter((mail) => mail.to === ADMIN_EMAIL);
    expect(mails).toHaveLength(1);
    expect(mails[0]!.text).toContain(response.body.reportId);
    expect(mails[0]!.text).toContain(`${harness.config.WEB_ORIGIN}/admin/denuncias`);
    expect(mails[0]!.text).not.toContain(CONTACT_EMAIL);
    expect((await reportRow(response.body.reportId)).adminNotifiedAt).toBeInstanceOf(Date);

    const logs = harness.logs();
    expect(logs).toContain(response.body.reportId);
    expect(logs).not.toContain(CONTACT_EMAIL);
    expect(logs).not.toContain(ip);
  });

  it("(a) aceita o link do anúncio no lugar do slug e exige um dos dois", async () => {
    const pro = await professionalWithProfile("link");
    const byUrl = await createPublicReport({
      targetUrl: `${harness.config.WEB_ORIGIN}/anuncio/${pro.slug}?ref=feed`,
      reason: "coercion",
    });
    expect(byUrl.status).toBe(200);
    const row = await reportRow(byUrl.body.reportId);
    expect(row.targetProfileId).toBe(pro.id);
    expect(row.profileSlug).toBe(pro.slug);

    const missing = await createPublicReport({});
    expect(missing.status).toBe(400);
  });

  it("(b) a 6ª denúncia do mesmo IP em 1 minuto responde 429", async () => {
    expect(PUBLIC_REPORT_RATE_LIMIT).toEqual({ windowMs: 60_000, max: 5 });
    const pro = await professionalWithProfile("b");
    const ip = nextIp();
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await createPublicReport({ profileSlug: pro.slug }, ip);
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 5).every((status) => status !== 429)).toBe(true);
    expect(statuses[5]).toBe(429);

    const otherIp = await createPublicReport({ profileSlug: pro.slug });
    expect(otherIp.status).toBe(200);
  });

  it("(c) remover imagem por denúncia grava o hash, apaga os arquivos e marca rejected", async () => {
    const pro = await professionalWithProfile("c");
    const asset = await uploadImage(pro.userId, await smoothNoiseJpeg(1));
    expect(asset.status).toBe("ready");
    const key = storageKeyFor(pro.userId, asset.id, "image/jpeg", "gallery");
    expect(harness.storage.objects.has(key)).toBe(true);
    expect(harness.storage.objects.has(`${key}.thumb.webp`)).toBe(true);

    const created = await createPublicReport({ profileSlug: pro.slug });
    const reportId = created.body.reportId;
    const cookie = await adminCookie();

    const media = await harness.rpc<Array<{ id: string; url: string | null }>>(
      "admin/reportTargetMedia",
      { id: reportId },
      { cookie },
    );
    expect(media.status).toBe(200);
    expect(media.body.map((item) => item.id)).toEqual([asset.id]);

    const acted = await harness.rpc(
      "admin/actOnReport",
      { id: reportId, action: "remove_media", assetId: asset.id, note: "Foto sem consentimento" },
      { cookie },
    );
    expect(acted.status).toBe(200);

    const hashes = await harness.db.select().from(blockedImageHashes);
    expect(hashes).toHaveLength(1);
    expect(hashes[0]).toMatchObject({ reportId, sourceAssetId: asset.id });
    expect(hashes[0]!.hash).toMatch(/^[0-9a-f]{16}$/);

    expect(harness.storage.objects.has(key)).toBe(false);
    expect(harness.storage.objects.has(`${key}.thumb.webp`)).toBe(false);
    const removed = await assetRow(asset.id);
    expect(removed.status).toBe("rejected");
    expect(removed.blockedByReportId).toBe(reportId);

    const row = await reportRow(reportId);
    expect(row).toMatchObject({
      status: "resolved",
      action: "remove_media",
      actionTargetId: asset.id,
      actionAdminEmail: DEV_ADMINS[0]!.email,
      resolution: "Foto sem consentimento",
    });
    expect(row.actionAdminId).toBeTruthy();
    expect(row.respondedAt).toBeInstanceOf(Date);
  });

  it("(d) a mesma imagem redimensionada e recomprimida é bloqueada; outra imagem passa", async () => {
    const pro = await professionalWithProfile("d");
    const original = await smoothNoiseJpeg(7);
    const asset = await uploadImage(pro.userId, original);
    const created = await createPublicReport({ profileSlug: pro.slug });
    const reportId = created.body.reportId;
    const cookie = await adminCookie();
    const acted = await harness.rpc(
      "admin/actOnReport",
      { id: reportId, action: "remove_media", assetId: asset.id, note: "" },
      { cookie },
    );
    expect(acted.status).toBe(200);

    const again = await uploadImage(pro.userId, await resizedAndRecompressed(original));
    expect(again.status).toBe("blocked");
    expect(again.url).toBeNull();
    expect(again.thumbnailUrl).toBeNull();
    expect(again.moderationReason).toBeTruthy();
    expect(again.moderationReason).not.toContain(reportId);
    const blockedRow = await assetRow(again.id);
    expect(blockedRow.blockedByReportId).toBe(reportId);
    expect(blockedRow.blockReason).toContain(reportId);
    const blockedKey = storageKeyFor(pro.userId, again.id, "image/jpeg", "gallery");
    expect(harness.storage.objects.has(blockedKey)).toBe(false);

    const different = await uploadImage(pro.userId, await smoothNoiseJpeg(99));
    expect(different.status).toBe("ready");
  });

  it("(e) provas vão para private/reports/<id>/ e só o admin abre por URL assinada", async () => {
    const pro = await professionalWithProfile("e");
    const evidence = [1, 2, 3].map(() => ({ contentType: "image/png", sizeBytes: 2048 }));
    const created = await createPublicReport({ profileSlug: pro.slug, evidence });
    expect(created.status).toBe(200);
    const reportId = created.body.reportId;
    expect(created.body.evidenceUploads).toHaveLength(3);

    const rows = await harness.db
      .select()
      .from(reportEvidence)
      .where(eq(reportEvidence.reportId, reportId));
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.storageKey).toMatch(new RegExp(`^private/reports/${reportId}/[0-9a-f-]+\\.png$`));
      expect(harness.storage.publicUrl(row.storageKey)).toBeNull();
      expect(JSON.stringify(created.body)).not.toContain(`http://storage.test/${row.storageKey}`);
      expect(created.body.evidenceUploads.map((upload) => upload.uploadUrl)).toContain(
        `http://storage.test/upload/${encodeURIComponent(row.storageKey)}`,
      );
    }

    const anonymous = await harness.rpc("admin/reportEvidence", { id: reportId });
    expect(anonymous.status).toBe(401);
    const user = await signUp(harness, { email: "curioso@test.dev", name: "Curioso" });
    const asUser = await harness.rpc(
      "admin/reportEvidence",
      { id: reportId },
      { cookie: user.cookie },
    );
    expect(asUser.status).toBe(401);

    const cookie = await adminCookie();
    const listed = await harness.rpc<Array<{ id: string; url: string }>>(
      "admin/reportEvidence",
      { id: reportId },
      { cookie },
    );
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(3);
    for (const item of listed.body) {
      expect(item.url).toContain("signed=1");
      expect(item.url).toContain(encodeURIComponent(`private/reports/${reportId}/`));
    }

    const queue = await harness.rpc<Array<Record<string, unknown>>>(
      "admin/reports",
      {},
      { cookie },
    );
    const listedReport = queue.body.find((item) => item.id === reportId);
    expect(listedReport).toMatchObject({ source: "public", evidenceCount: 3 });
    expect(JSON.stringify(queue.body)).not.toContain(CONTACT_EMAIL);

    const tooMany = await createPublicReport({
      profileSlug: pro.slug,
      evidence: [...evidence, { contentType: "image/png", sizeBytes: 2048 }],
    });
    expect(tooMany.status).toBe(400);
  });

  it("(f) imagem lisa removida por denúncia não grava hash e outra imagem lisa passa", async () => {
    const pro = await professionalWithProfile("f");
    const asset = await uploadImage(pro.userId, await flatJpeg(200, 40, 90));
    expect(asset.status).toBe("ready");
    const created = await createPublicReport({ profileSlug: pro.slug });
    const cookie = await adminCookie();
    const acted = await harness.rpc(
      "admin/actOnReport",
      { id: created.body.reportId, action: "remove_media", assetId: asset.id, note: "" },
      { cookie },
    );
    expect(acted.status).toBe(200);
    expect(await harness.db.select().from(blockedImageHashes)).toHaveLength(0);
    expect((await assetRow(asset.id)).status).toBe("rejected");

    const other = await uploadImage(pro.userId, await flatJpeg(10, 200, 30));
    expect(other.status).toBe("ready");
  });

  it("(g) resolveReport grava o admin que agiu e quando respondeu", async () => {
    const pro = await professionalWithProfile("g");
    const created = await createPublicReport({ profileSlug: pro.slug });
    const cookie = await adminCookie();
    const resolved = await harness.rpc(
      "admin/resolveReport",
      { id: created.body.reportId, resolution: "dismissed", note: "Sem elementos" },
      { cookie },
    );
    expect(resolved.status).toBe(200);
    const row = await reportRow(created.body.reportId);
    expect(row.status).toBe("dismissed");
    expect(row.actionAdminEmail).toBe(DEV_ADMINS[0]!.email);
    expect(row.actionAdminId).toBeTruthy();
    expect(row.respondedAt).toBeInstanceOf(Date);
  });

  it("despublicar por denúncia rejeita o anúncio com motivo prefixado e não suspende", async () => {
    const pro = await professionalWithProfile("unpub");
    const created = await createPublicReport({ profileSlug: pro.slug });
    const reportId = created.body.reportId;
    const cookie = await adminCookie();
    const acted = await harness.rpc(
      "admin/actOnReport",
      { id: reportId, action: "unpublish_profile", note: "Conteúdo ilegal" },
      { cookie },
    );
    expect(acted.status).toBe(200);
    const [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, pro.id));
    expect(profile?.verificationStatus).toBe("rejected");
    expect(profile?.rejectionReason?.startsWith(`Denúncia #${reportId}`)).toBe(true);
    expect(profile?.isSuspended).toBe(false);
    expect(await reportRow(reportId)).toMatchObject({
      status: "resolved",
      action: "unpublish_profile",
      actionTargetId: pro.id,
    });
  });

  it("encerrar sem ação arquiva a denúncia e não mexe no anúncio", async () => {
    const pro = await professionalWithProfile("dismiss");
    const created = await createPublicReport({ profileSlug: pro.slug });
    const reportId = created.body.reportId;
    const cookie = await adminCookie();
    const acted = await harness.rpc(
      "admin/actOnReport",
      { id: reportId, action: "dismiss", note: "Sem violação" },
      { cookie },
    );
    expect(acted.status).toBe(200);
    expect(await reportRow(reportId)).toMatchObject({
      status: "dismissed",
      action: "dismiss",
      actionAdminEmail: DEV_ADMINS[0]!.email,
    });
    const again = await harness.rpc(
      "admin/actOnReport",
      { id: reportId, action: "dismiss", note: "" },
      { cookie },
    );
    expect(again.status).toBe(409);
    const [profile] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, pro.id));
    expect(profile?.verificationStatus).toBe("published");
  });

  it("denúncia do chat continua pelo contrato antigo, grava source=chat e agenda o e-mail", async () => {
    const fx = await createChatFixture(harness);
    const result = await fx.chat.report(fx.client, {
      conversationId: fx.conversationId,
      type: "scam",
      reason: "Pediu depósito antecipado",
    });
    expect(result).toEqual({ ok: true });
    const rows = await harness.db.select().from(reports);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: "chat",
      type: "scam",
      reporterUserId: fx.client.id,
      reportedUserId: fx.professional.id,
      targetProfileId: fx.profileId,
    });
    expect(harness.jobs.delayed.map((job) => job.name)).toContain(ADMIN_REPORT_DIGEST_JOB);
  });
});
