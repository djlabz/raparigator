import { REPORT_RESPONSE_SLA_HOURS, PUBLIC_REPORT_REASON_LABELS } from "@sigillus/contracts";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";
import { createReportsRepository, type ReportRow } from "./repository";
import { formatDateBR } from "@sigillus/domain";
import { registerAdminDigestJob } from "../../lib/admin-digest";

export const ADMIN_REPORT_DIGEST_JOB = "admin.report-digest";
const ADMIN_REPORT_DIGEST_WINDOW_SECONDS = 3600;

const HOUR_MS = 60 * 60 * 1000;

export type AdminReportDigestDeps = {
  db: Database;
  config: Pick<AppConfig, "ADMIN_NOTIFY_EMAIL" | "WEB_ORIGIN">;
  mailer: Mailer;
  jobs: JobQueue;
  logger: Logger;
};

export async function enqueueAdminReportDigest(jobs: JobQueue, now: Date = new Date()) {
  await jobs.enqueue(
    ADMIN_REPORT_DIGEST_JOB,
    {},
    { startAfter: new Date(now.getTime() + ADMIN_REPORT_DIGEST_WINDOW_SECONDS * 1000) },
  );
}

function reasonLabel(report: ReportRow): string {
  if (report.source === "public") {
    return PUBLIC_REPORT_REASON_LABELS[report.reason ?? "other"];
  }
  return "Denúncia de conversa";
}

function buildAdminReportDigestEmail(rows: ReportRow[], webOrigin: string) {
  const subject =
    rows.length === 1
      ? "1 denúncia nova para analisar"
      : `${rows.length} denúncias novas para analisar`;
  const queueUrl = new URL("/admin/denuncias", webOrigin).toString();
  const lines = rows.map((report) =>
    [
      `- Denúncia #${report.id}`,
      `  Origem: ${report.source === "public" ? "Canal público" : "Chat"}`,
      `  Motivo: ${reasonLabel(report)}`,
      `  Recebida em: ${formatDateBR(report.createdAt, "dateTime")}`,
      `  Responder até: ${formatDateBR(new Date(report.createdAt.getTime() + REPORT_RESPONSE_SLA_HOURS * HOUR_MS), "dateTime")}`,
    ].join("\n"),
  );
  const text = [
    rows.length === 1
      ? "Uma denúncia nova entrou na fila do Sigillus:"
      : `${rows.length} denúncias novas entraram na fila do Sigillus:`,
    "",
    lines.join("\n\n"),
    "",
    `Abrir a fila: ${queueUrl}`,
    "",
  ].join("\n");
  return { subject, text };
}

export async function registerAdminReportDigestJob(deps: AdminReportDigestDeps): Promise<void> {
  const repo = createReportsRepository(deps.db);
  await registerAdminDigestJob(deps, {
    name: ADMIN_REPORT_DIGEST_JOB,
    topic: "denúncias",
    logKey: "reports",
    claim: (claimedAt) => repo.claimUnnotified(claimedAt),
    release: (ids, claimedAt) => repo.releaseClaim(ids, claimedAt),
    buildEmail: (claimed, webOrigin) =>
      buildAdminReportDigestEmail(
        [...claimed].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        webOrigin,
      ),
  });
}
