import {
  REPORT_EVIDENCE_MAX_BYTES,
  REPORT_EVIDENCE_RETENTION_DAYS,
  REPORT_EVIDENCE_UNCONFIRMED_HOURS,
} from "@sigillus/contracts";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { ObjectStorage } from "../../lib/storage";
import { stripImageMetadata } from "../media/jobs";
import { createReportsRepository, type ReportEvidenceRow } from "./repository";

export { REPORT_EVIDENCE_RETENTION_DAYS, REPORT_EVIDENCE_UNCONFIRMED_HOURS };

export const REPORT_EVIDENCE_PROCESS_JOB = "report.evidence-process";
export const REPORT_EVIDENCE_RETENTION_JOB = "report.evidence-retention";
export const REPORT_EVIDENCE_RETENTION_CRON = "30 4 * * *";
export const REPORT_EVIDENCE_PROCESS_GRACE_HOURS = 1;
export const REPORT_EVIDENCE_PURGE_MARGIN_HOURS = 2;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export type ReportEvidenceDeps = {
  db: Database;
  storage: ObjectStorage;
  logger: Logger;
};

export function isEvidenceUploadOpen(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() < REPORT_EVIDENCE_UNCONFIRMED_HOURS * HOUR_MS;
}

export function isEvidenceProcessable(createdAt: Date, now = new Date()): boolean {
  return (
    now.getTime() - createdAt.getTime() <
    (REPORT_EVIDENCE_UNCONFIRMED_HOURS + REPORT_EVIDENCE_PROCESS_GRACE_HOURS) * HOUR_MS
  );
}

const CLEAN_SUFFIX = ".clean";

export function cleanEvidenceKey(uploadKey: string): string {
  return uploadKey.replace(/(\.[a-z0-9]+)$/, `${CLEAN_SUFFIX}$1`);
}

export function uploadEvidenceKey(storageKey: string): string {
  return storageKey.replace(`${CLEAN_SUFFIX}.`, ".");
}

async function discardEvidence(deps: ReportEvidenceDeps, row: ReportEvidenceRow) {
  const keys = new Set([row.storageKey, uploadEvidenceKey(row.storageKey)]);
  for (const key of keys) {
    await deps.storage.deleteObject(key);
  }
  await createReportsRepository(deps.db).deleteEvidence(row.id);
}

async function cleanImage(bytes: Uint8Array, contentType: string) {
  try {
    return await stripImageMetadata(bytes, contentType);
  } catch {
    return null;
  }
}

export async function processReportEvidence(deps: ReportEvidenceDeps, evidenceId: string) {
  const { storage, logger } = deps;
  const repo = createReportsRepository(deps.db);
  const row = await repo.findEvidence(evidenceId);
  if (!row) {
    return;
  }
  if (row.confirmedAt) {
    await storage.deleteObject(uploadEvidenceKey(row.storageKey));
    return;
  }
  if (!isEvidenceProcessable(row.createdAt)) {
    return;
  }
  const head = await storage.head(row.storageKey);
  if (!head) {
    return;
  }
  const contentType = head.contentType ?? row.contentType;
  if (head.sizeBytes > REPORT_EVIDENCE_MAX_BYTES || !contentType.startsWith("image/")) {
    await discardEvidence(deps, row);
    logger.warn({ evidenceId, reportId: row.reportId }, "prova recusada: tipo ou tamanho");
    return;
  }
  const clean = await cleanImage(await storage.getObject(row.storageKey), contentType);
  if (!clean) {
    await discardEvidence(deps, row);
    logger.warn({ evidenceId, reportId: row.reportId }, "prova recusada: imagem ilegível");
    return;
  }
  const cleanKey = cleanEvidenceKey(row.storageKey);
  await storage.putObject(cleanKey, clean.data, contentType);
  await repo.confirmEvidence(row.id, { storageKey: cleanKey, confirmedAt: new Date() });
  await storage.deleteObject(row.storageKey);
  logger.info({ evidenceId, reportId: row.reportId }, "prova confirmada sem metadados");
}

export async function purgeReportEvidence(
  deps: ReportEvidenceDeps,
  now: Date = new Date(),
): Promise<{ unconfirmed: number; expired: number; failed: number }> {
  const repo = createReportsRepository(deps.db);
  const unconfirmed = await repo.listUnconfirmedBefore(
    new Date(
      now.getTime() -
        (REPORT_EVIDENCE_UNCONFIRMED_HOURS + REPORT_EVIDENCE_PURGE_MARGIN_HOURS) * HOUR_MS,
    ),
  );
  const expired = await repo.listEvidenceOfReportsClosedBefore(
    new Date(now.getTime() - REPORT_EVIDENCE_RETENTION_DAYS * DAY_MS),
  );
  let failed = 0;
  for (const row of [...unconfirmed, ...expired]) {
    try {
      await discardEvidence(deps, row);
    } catch (err) {
      failed += 1;
      deps.logger.warn({ err, evidenceId: row.id }, "falha ao apagar prova de denúncia");
    }
  }
  const result = {
    unconfirmed: unconfirmed.length,
    expired: expired.length,
    failed,
  };
  if (result.unconfirmed + result.expired > 0) {
    deps.logger.info(result, "provas de denúncia apagadas pela retenção");
  }
  return result;
}

export async function registerReportEvidenceJobs(deps: ReportEvidenceDeps & { jobs: JobQueue }) {
  const { jobs } = deps;
  await jobs.work(REPORT_EVIDENCE_PROCESS_JOB, async ({ evidenceId }) => {
    await processReportEvidence(deps, evidenceId);
  });
  await jobs.work(REPORT_EVIDENCE_RETENTION_JOB, async () => {
    await purgeReportEvidence(deps);
  });
  await jobs.schedule(REPORT_EVIDENCE_RETENTION_JOB, REPORT_EVIDENCE_RETENTION_CRON);
}
