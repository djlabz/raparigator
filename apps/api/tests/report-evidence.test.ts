import { eq } from "drizzle-orm";
import sharp from "sharp";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { accessLogs, reportEvidence, reports } from "../src/db/schema";
import { DEV_ADMINS, upsertAdminWithPassword } from "../src/db/seed/users";
import { registerAccessLogJobs } from "../src/modules/access-log";
import {
  REPORT_EVIDENCE_PROCESS_GRACE_HOURS,
  REPORT_EVIDENCE_PURGE_MARGIN_HOURS,
  REPORT_EVIDENCE_RETENTION_DAYS,
  REPORT_EVIDENCE_UNCONFIRMED_HOURS,
  processReportEvidence,
  purgeReportEvidence,
  registerReportEvidenceJobs,
} from "../src/modules/reports";
import { createTestHarness } from "./helpers/app";
import { signInAdmin, signUp } from "./helpers/auth";
import { createPublishedProfile } from "./helpers/conversations";

const CONTACT_EMAIL = "contato-denuncia@contato.dev";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const harness = createTestHarness();

let ipCounter = 0;

function nextIp() {
  ipCounter += 1;
  return `203.0.113.${ipCounter}`;
}

type CreatePublicOutput = {
  reportId: string;
  evidenceUploads: Array<{ uploadUrl: string }>;
};

async function jpegWithGps() {
  return sharp({
    create: { width: 320, height: 200, channels: 3, background: { r: 120, g: 40, b: 200 } },
  })
    .withMetadata({ orientation: 6 })
    .withExifMerge({
      IFD0: { Make: "CelularDeTeste" },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "23/1 33/1 0/1",
        GPSLongitudeRef: "W",
        GPSLongitude: "46/1 38/1 0/1",
      },
    })
    .jpeg()
    .toBuffer();
}

async function adminCookie() {
  await upsertAdminWithPassword(harness.db, DEV_ADMINS[0]!);
  return signInAdmin(harness, DEV_ADMINS[0]!.email, DEV_ADMINS[0]!.password);
}

async function publicReportWithEvidence(tag: string, files: number, contactEmail?: string) {
  const user = await signUp(harness, {
    email: `pro-ev-${tag}@test.dev`,
    role: "profissional",
    name: "Nome Civil",
    alias: `Aurora ${tag}`,
  });
  const profile = await createPublishedProfile(harness, user.userId, { slug: `aurora-${tag}` });
  const bytes = await jpegWithGps();
  const created = await harness.rpc<CreatePublicOutput>(
    "reports/createPublic",
    {
      profileSlug: profile.slug,
      reason: "photo_without_consent",
      details: "Foto publicada sem o meu consentimento.",
      contactEmail,
      evidence: Array.from({ length: files }, () => ({
        contentType: "image/jpeg",
        sizeBytes: bytes.byteLength,
      })),
    },
    { "x-forwarded-for": `${nextIp()}, 10.0.0.1` },
  );
  expect(created.status).toBe(200);
  const rows = await harness.db
    .select()
    .from(reportEvidence)
    .where(eq(reportEvidence.reportId, created.body.reportId));
  return { reportId: created.body.reportId, rows, bytes };
}

async function completeEvidence(reportId: string) {
  return harness.rpc<{ confirmed: number }>(
    "reports/completeEvidence",
    { reportId },
    { "x-forwarded-for": `${nextIp()}, 10.0.0.1` },
  );
}

async function listEvidence(reportId: string, cookie: string) {
  return harness.rpc<Array<{ id: string; url: string }>>(
    "admin/reportEvidence",
    { id: reportId },
    { cookie },
  );
}

beforeAll(async () => {
  await registerReportEvidenceJobs({
    db: harness.db,
    storage: harness.storage,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
  await registerAccessLogJobs({
    db: harness.db,
    jobs: harness.jobs,
    logger: harness.deps.logger,
  });
});

beforeEach(() => {
  harness.jobs.enqueued.length = 0;
  harness.jobs.clearDelayed();
});

describe("provas da denúncia: limpeza, confirmação, retenção e contato", () => {
  it("prova com GPS chega ao admin sem EXIF e com a orientação aplicada", async () => {
    const { reportId, rows, bytes } = await publicReportWithEvidence("gps", 1);
    expect((await sharp(bytes).metadata()).exif).toBeDefined();
    await harness.storage.putObject(rows[0]!.storageKey, new Uint8Array(bytes), "image/jpeg");

    const confirmed = await completeEvidence(reportId);
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.confirmed).toBe(1);

    const cookie = await adminCookie();
    const listed = await listEvidence(reportId, cookie);
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);

    const [confirmedRow] = await harness.db
      .select()
      .from(reportEvidence)
      .where(eq(reportEvidence.id, rows[0]!.id));
    expect(confirmedRow!.storageKey).not.toBe(rows[0]!.storageKey);
    expect(await harness.storage.head(rows[0]!.storageKey)).toBeNull();
    expect(listed.body[0]!.url).toContain(encodeURIComponent(confirmedRow!.storageKey));
    const stored = await harness.storage.getObject(confirmedRow!.storageKey);
    const metadata = await sharp(Buffer.from(stored)).metadata();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.width).toBe(200);
    expect(metadata.height).toBe(320);
  });

  it("novo PUT no URL de upload depois da confirmação não troca a prova limpa", async () => {
    const { reportId, rows, bytes } = await publicReportWithEvidence("toctou", 1);
    const uploadKey = rows[0]!.storageKey;
    await harness.storage.putObject(uploadKey, new Uint8Array(bytes), "image/jpeg");
    expect((await completeEvidence(reportId)).body.confirmed).toBe(1);

    await harness.storage.putObject(uploadKey, new Uint8Array(bytes), "image/jpeg");
    expect((await completeEvidence(reportId)).body.confirmed).toBe(0);

    const [row] = await harness.db
      .select()
      .from(reportEvidence)
      .where(eq(reportEvidence.id, rows[0]!.id));
    const served = await harness.storage.getObject(row!.storageKey);
    expect((await sharp(Buffer.from(served)).metadata()).exif).toBeUndefined();

    await harness.db
      .update(reports)
      .set({
        status: "dismissed",
        respondedAt: new Date(Date.now() - (REPORT_EVIDENCE_RETENTION_DAYS + 1) * DAY_MS),
      })
      .where(eq(reports.id, reportId));
    await purgeReportEvidence({
      db: harness.db,
      storage: harness.storage,
      logger: harness.deps.logger,
    });
    expect(await harness.storage.head(row!.storageKey)).toBeNull();
    expect(await harness.storage.head(uploadKey)).toBeNull();
  });

  it("falha transitória do storage não descarta a prova e o job pode tentar de novo", async () => {
    const { reportId, rows, bytes } = await publicReportWithEvidence("transitoria", 1);
    await harness.storage.putObject(rows[0]!.storageKey, new Uint8Array(bytes), "image/jpeg");
    const storage = {
      ...harness.storage,
      getObject: async () => {
        throw new Error("storage indisponível");
      },
    };
    await expect(
      processReportEvidence({ db: harness.db, storage, logger: harness.deps.logger }, rows[0]!.id),
    ).rejects.toThrow("storage indisponível");
    const [row] = await harness.db
      .select()
      .from(reportEvidence)
      .where(eq(reportEvidence.id, rows[0]!.id));
    expect(row).toMatchObject({ confirmedAt: null, storageKey: rows[0]!.storageKey });
    expect(await harness.storage.head(rows[0]!.storageKey)).not.toBeNull();

    expect((await completeEvidence(reportId)).body.confirmed).toBe(1);
  });

  it("se o original não sai depois da confirmação, a nova tentativa do job apaga", async () => {
    const { rows, bytes } = await publicReportWithEvidence("original", 1);
    const uploadKey = rows[0]!.storageKey;
    await harness.storage.putObject(uploadKey, new Uint8Array(bytes), "image/jpeg");
    const failing = {
      ...harness.storage,
      deleteObject: async () => {
        throw new Error("storage indisponível");
      },
    };
    await expect(
      processReportEvidence(
        { db: harness.db, storage: failing, logger: harness.deps.logger },
        rows[0]!.id,
      ),
    ).rejects.toThrow("storage indisponível");
    expect(await harness.storage.head(uploadKey)).not.toBeNull();

    await processReportEvidence(
      { db: harness.db, storage: harness.storage, logger: harness.deps.logger },
      rows[0]!.id,
    );
    expect(await harness.storage.head(uploadKey)).toBeNull();
  });

  it("job atrasado na fila ainda processa dentro da folga, e não depois dela", async () => {
    const deps = { db: harness.db, storage: harness.storage, logger: harness.deps.logger };
    const ageAt = async (tag: string, hours: number) => {
      const { rows, bytes } = await publicReportWithEvidence(tag, 1);
      await harness.storage.putObject(rows[0]!.storageKey, new Uint8Array(bytes), "image/jpeg");
      await harness.db
        .update(reportEvidence)
        .set({ createdAt: new Date(Date.now() - hours * HOUR_MS) })
        .where(eq(reportEvidence.id, rows[0]!.id));
      await processReportEvidence(deps, rows[0]!.id);
      const [row] = await harness.db
        .select()
        .from(reportEvidence)
        .where(eq(reportEvidence.id, rows[0]!.id));
      return row!;
    };
    const delayed = await ageAt("atrasada", REPORT_EVIDENCE_UNCONFIRMED_HOURS + 0.5);
    expect(delayed.confirmedAt).not.toBeNull();
    const late = await ageAt(
      "tarde",
      REPORT_EVIDENCE_UNCONFIRMED_HOURS + REPORT_EVIDENCE_PROCESS_GRACE_HOURS + 0.5,
    );
    expect(late.confirmedAt).toBeNull();
    expect(REPORT_EVIDENCE_PURGE_MARGIN_HOURS).toBeGreaterThan(REPORT_EVIDENCE_PROCESS_GRACE_HOURS);
  });

  it("falha ao apagar o arquivo na retenção mantém o registro para a próxima execução", async () => {
    const { rows, bytes } = await publicReportWithEvidence("apagar", 1);
    await harness.storage.putObject(rows[0]!.storageKey, new Uint8Array(bytes), "image/jpeg");
    const storage = {
      ...harness.storage,
      deleteObject: async () => {
        throw new Error("storage indisponível");
      },
    };
    const later = new Date(
      rows[0]!.createdAt.getTime() +
        (REPORT_EVIDENCE_UNCONFIRMED_HOURS + REPORT_EVIDENCE_PURGE_MARGIN_HOURS + 1) * HOUR_MS,
    );
    const result = await purgeReportEvidence(
      { db: harness.db, storage, logger: harness.deps.logger },
      later,
    );
    expect(result.failed).toBeGreaterThanOrEqual(1);
    const [row] = await harness.db
      .select()
      .from(reportEvidence)
      .where(eq(reportEvidence.id, rows[0]!.id));
    expect(row).toBeDefined();
  });

  it("prova sem confirmação não aparece para o admin e o job apaga depois de 24 h", async () => {
    const { reportId, rows, bytes } = await publicReportWithEvidence("pendente", 2);
    await harness.storage.putObject(rows[0]!.storageKey, new Uint8Array(bytes), "image/jpeg");
    await harness.storage.putObject(rows[1]!.storageKey, new Uint8Array(bytes), "image/jpeg");

    const cookie = await adminCookie();
    const listed = await listEvidence(reportId, cookie);
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(0);
    const queue = await harness.rpc<Array<{ id: string; evidenceCount: number }>>(
      "admin/reports",
      {},
      { cookie },
    );
    expect(queue.body.find((item) => item.id === reportId)?.evidenceCount).toBe(0);

    const createdAt = rows[0]!.createdAt.getTime();
    await purgeReportEvidence(
      { db: harness.db, storage: harness.storage, logger: harness.deps.logger },
      new Date(createdAt + (REPORT_EVIDENCE_UNCONFIRMED_HOURS - 1) * HOUR_MS),
    );
    expect(await harness.storage.head(rows[0]!.storageKey)).not.toBeNull();

    await purgeReportEvidence(
      { db: harness.db, storage: harness.storage, logger: harness.deps.logger },
      new Date(
        createdAt +
          (REPORT_EVIDENCE_UNCONFIRMED_HOURS + REPORT_EVIDENCE_PURGE_MARGIN_HOURS + 1) * HOUR_MS,
      ),
    );
    expect(await harness.storage.head(rows[0]!.storageKey)).toBeNull();
    expect(await harness.storage.head(rows[1]!.storageKey)).toBeNull();
    const left = await harness.db
      .select()
      .from(reportEvidence)
      .where(eq(reportEvidence.reportId, reportId));
    expect(left).toHaveLength(0);
    const [report] = await harness.db.select().from(reports).where(eq(reports.id, reportId));
    expect(report).toBeDefined();
  });

  it("denúncia encerrada há mais de 180 dias perde as provas e mantém o registro", async () => {
    const old = await publicReportWithEvidence("antiga", 1);
    const recent = await publicReportWithEvidence("recente", 1);
    for (const item of [old, recent]) {
      await harness.storage.putObject(
        item.rows[0]!.storageKey,
        new Uint8Array(item.bytes),
        "image/jpeg",
      );
      expect((await completeEvidence(item.reportId)).body.confirmed).toBe(1);
    }

    const currentKey = async (id: string) => {
      const [row] = await harness.db.select().from(reportEvidence).where(eq(reportEvidence.id, id));
      return row!.storageKey;
    };
    const oldKey = await currentKey(old.rows[0]!.id);
    const recentKey = await currentKey(recent.rows[0]!.id);

    const now = new Date();
    await harness.db
      .update(reports)
      .set({
        status: "dismissed",
        respondedAt: new Date(now.getTime() - (REPORT_EVIDENCE_RETENTION_DAYS + 1) * DAY_MS),
      })
      .where(eq(reports.id, old.reportId));
    await harness.db
      .update(reports)
      .set({
        status: "resolved",
        respondedAt: new Date(now.getTime() - (REPORT_EVIDENCE_RETENTION_DAYS - 1) * DAY_MS),
      })
      .where(eq(reports.id, recent.reportId));

    await purgeReportEvidence(
      { db: harness.db, storage: harness.storage, logger: harness.deps.logger },
      now,
    );

    expect(await harness.storage.head(oldKey)).toBeNull();
    expect(await harness.storage.head(recentKey)).not.toBeNull();
    const [oldReport] = await harness.db.select().from(reports).where(eq(reports.id, old.reportId));
    expect(oldReport).toMatchObject({ status: "dismissed" });

    const cookie = await adminCookie();
    expect((await listEvidence(old.reportId, cookie)).body).toHaveLength(0);
    expect((await listEvidence(recent.reportId, cookie)).body).toHaveLength(1);
  });

  it("ver contato exige admin, devolve o e-mail e grava report_contact_view no access_log", async () => {
    const { reportId } = await publicReportWithEvidence("contato", 0, CONTACT_EMAIL);

    const anonymous = await harness.rpc("admin/reportContact", { id: reportId });
    expect(anonymous.status).toBe(401);

    const cookie = await adminCookie();
    const queue = await harness.rpc("admin/reports", {}, { cookie });
    expect(JSON.stringify(queue.body)).not.toContain(CONTACT_EMAIL);

    const contact = await harness.rpc<{ contactEmail: string | null }>(
      "admin/reportContact",
      { id: reportId },
      { cookie, "x-forwarded-for": "192.0.2.44, 10.0.0.1" },
    );
    expect(contact.status).toBe(200);
    expect(contact.body.contactEmail).toBe(CONTACT_EMAIL);

    const logs = await harness.db
      .select()
      .from(accessLogs)
      .where(eq(accessLogs.event, "report_contact_view"));
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ ip: "192.0.2.44" });
    expect(logs[0]!.userId).not.toBe("");
  });
});
