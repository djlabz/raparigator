import type { Database } from "../../client";
import { reports } from "../../schema";
import { fixtures } from "./fixtures";

export async function seedReports(db: Database) {
  for (const report of fixtures.seedReports) {
    await db
      .insert(reports)
      .values({
        id: `seed-report-${report.id}`,
        type: report.type,
        reporterName: report.reporterName,
        reporterRole: report.reporterRole,
        reportedName: report.reportedName,
        reportedRole: report.reportedRole,
        description: report.description,
        status: report.status,
        resolution: report.resolution ?? null,
        createdAt: new Date(report.createdAt),
        updatedAt: report.updatedAt ? new Date(report.updatedAt) : null,
      })
      .onConflictDoNothing();
  }
}
