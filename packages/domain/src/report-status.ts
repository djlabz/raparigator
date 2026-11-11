import type { ReportStatus } from "@sigillus/contracts";

export function isReportOpen(status: ReportStatus): boolean {
  return status !== "resolved" && status !== "dismissed";
}

export function canStartReportReview(status: ReportStatus): boolean {
  return status === "pending";
}
