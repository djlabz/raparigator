import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { professionalProfiles } from "../src/db/schema";
import type { Logger } from "../src/lib/logger";
import {
  ADMIN_REVIEW_DIGEST_JOB,
  ADMIN_REVIEW_DIGEST_WINDOW_SECONDS,
  registerAdminReviewDigestJob,
} from "../src/modules/announcements/review-digest";
import { createTestHarness } from "./helpers/app";
import { signUp } from "./helpers/auth";
import { completeDraft } from "./helpers/drafts";

const ADMIN_EMAIL = "revisao@sigillus.test";

const previousAdminEmail = process.env.ADMIN_NOTIFY_EMAIL;
process.env.ADMIN_NOTIFY_EMAIL = ADMIN_EMAIL;
const harness = createTestHarness();

afterAll(() => {
  if (previousAdminEmail === undefined) {
    delete process.env.ADMIN_NOTIFY_EMAIL;
  } else {
    process.env.ADMIN_NOTIFY_EMAIL = previousAdminEmail;
  }
});

function captureLogger() {
  const info = vi.fn();
  const logger = {
    info,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  } as unknown as Logger;
  return { logger, info };
}

async function register(adminEmail: string | undefined, logger = captureLogger().logger) {
  await registerAdminReviewDigestJob({
    db: harness.db,
    config: { ...harness.config, ADMIN_NOTIFY_EMAIL: adminEmail },
    mailer: harness.mailer,
    jobs: harness.jobs,
    logger,
  });
}

async function publishProfile(email: string, name: string) {
  const user = await signUp(harness, { email, role: "profissional", name });
  const owner = { id: user.userId, name, alias: name };
  const result = await harness.deps.services.announcements.publish(owner, completeDraft());
  expect(result.ok).toBe(true);
  const [row] = await harness.db
    .select()
    .from(professionalProfiles)
    .where(eq(professionalProfiles.userId, user.userId));
  expect(row?.verificationStatus).toBe("pending_review");
  return row!;
}

function adminMails() {
  return harness.mailer.sent.filter((message) => message.to === ADMIN_EMAIL);
}

function digestJobs() {
  return harness.jobs.enqueued.filter((job) => job.name === ADMIN_REVIEW_DIGEST_JOB);
}

describe("e-mail ao admin quando um perfil entra em pending_review", () => {
  beforeEach(() => {
    harness.jobs.enqueued.length = 0;
    harness.jobs.clearDelayed();
  });

  it("a janela de agrupamento é de 1 hora", () => {
    expect(ADMIN_REVIEW_DIGEST_WINDOW_SECONDS).toBe(3600);
  });

  it("publicar enfileira o job e o envio leva nome, cidade, data e o link de revisão", async () => {
    await register(ADMIN_EMAIL);
    const profile = await publishProfile("pro-digest-a@test.dev", "Ana Digest");

    expect(digestJobs()).toHaveLength(1);
    expect(adminMails()).toHaveLength(0);

    await harness.jobs.runDelayed();

    const mails = adminMails();
    expect(mails).toHaveLength(1);
    const [mail] = mails;
    const link = `${harness.config.WEB_ORIGIN}/admin/perfis/${profile.id}`;
    expect(mail!.text).toContain(link);
    expect(mail!.text).toContain("Ana Digest");
    expect(mail!.text).toContain("Sao Paulo");
    expect(mail!.text).toMatch(/\d{2}\/\d{2}\/\d{4}/);

    const [after] = await harness.db
      .select()
      .from(professionalProfiles)
      .where(eq(professionalProfiles.id, profile.id));
    expect(after?.reviewNotifiedAt).toBeInstanceOf(Date);
  });

  it("três perfis em sequência na janela geram um envio só listando os três", async () => {
    await register(ADMIN_EMAIL);
    const profiles = [
      await publishProfile("pro-digest-1@test.dev", "Primeira Digest"),
      await publishProfile("pro-digest-2@test.dev", "Segunda Digest"),
      await publishProfile("pro-digest-3@test.dev", "Terceira Digest"),
    ];

    expect(digestJobs()).toHaveLength(3);
    await harness.jobs.runDelayed();
    await harness.jobs.runDelayed();

    const mails = adminMails();
    expect(mails).toHaveLength(1);
    for (const profile of profiles) {
      expect(mails[0]!.text).toContain(`/admin/perfis/${profile.id}`);
    }
    expect(mails[0]!.text).toContain("Primeira Digest");
    expect(mails[0]!.text).toContain("Segunda Digest");
    expect(mails[0]!.text).toContain("Terceira Digest");
  });

  it("sem ADMIN_NOTIFY_EMAIL não envia nada e registra só que pulou e quantos perfis", async () => {
    const { logger, info } = captureLogger();
    await register(undefined, logger);
    await publishProfile("pro-digest-x@test.dev", "Xis Digest");
    await publishProfile("pro-digest-y@test.dev", "Ypsilon Digest");

    await harness.jobs.runDelayed();

    expect(harness.mailer.sent).toHaveLength(0);
    const skipped = info.mock.calls.filter(([, message]) => String(message).includes("pulada"));
    expect(skipped).toHaveLength(1);
    expect(skipped[0]![0]).toEqual({ profiles: 2 });
  });
});
