import { REPORT_RESPONSE_SLA_HOURS, type PublicReportReason } from "@sigillus/contracts";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";
import { createReportsRepository, type ReportRow } from "./repository";

export const ADMIN_REPORT_DIGEST_JOB = "admin.report-digest";
const ADMIN_REPORT_DIGEST_WINDOW_SECONDS = 3600;

const DIGEST_TIME_ZONE = "America/Sao_Paulo";
const HOUR_MS = 60 * 60 * 1000;

const PUBLIC_REASON_LABELS: Record<PublicReportReason, string> = {
  photo_without_consent: "Foto sem consentimento",
  minor: "Menor de idade",
  coercion: "Coação",
  illegal_content: "Conteúdo ilegal",
  other: "Outro",
};

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

function formatDate(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: DIGEST_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reasonLabel(report: ReportRow): string {
  if (report.source === "public") {
    return PUBLIC_REASON_LABELS[report.reason ?? "other"];
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
      `  Recebida em: ${formatDate(report.createdAt)}`,
      `  Responder até: ${formatDate(new Date(report.createdAt.getTime() + REPORT_RESPONSE_SLA_HOURS * HOUR_MS))}`,
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
  const { db, config, mailer, jobs, logger } = deps;
  const repo = createReportsRepository(db);

  await jobs.work(ADMIN_REPORT_DIGEST_JOB, async () => {
    const claimedAt = new Date();
    const claimed = await repo.claimUnnotified(claimedAt);
    if (claimed.length === 0) {
      return;
    }
    if (!config.ADMIN_NOTIFY_EMAIL) {
      logger.info(
        { reports: claimed.length },
        "notificação de denúncias pulada (ADMIN_NOTIFY_EMAIL ausente)",
      );
      return;
    }
    const ordered = [...claimed].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const { subject, text } = buildAdminReportDigestEmail(ordered, config.WEB_ORIGIN);
    const result = await mailer.send({
      kind: "admin-notify",
      to: config.ADMIN_NOTIFY_EMAIL,
      subject,
      text,
    });
    if (!result.ok) {
      await repo.releaseClaim(
        claimed.map((report) => report.id),
        claimedAt,
      );
      throw new Error("falha ao enviar o resumo de denúncias");
    }
    logger.info({ reports: claimed.length }, "resumo de denúncias enviado ao admin");
  });
}
