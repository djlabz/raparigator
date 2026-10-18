import { and, count, desc, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import type { Database } from "../../db/client";
import { blockedImageHashes, reportEvidence, reports } from "../../db/schema";

export type ReportRow = typeof reports.$inferSelect;
export type ReportInsert = typeof reports.$inferInsert;
export type ReportEvidenceRow = typeof reportEvidence.$inferSelect;

export type ReportsRepository = ReturnType<typeof createReportsRepository>;

export function createReportsRepository(db: Database) {
  return {
    async insert(values: ReportInsert): Promise<ReportRow> {
      const [row] = await db.insert(reports).values(values).returning();
      return row!;
    },

    async findById(id: string): Promise<ReportRow | null> {
      const [row] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
      return row ?? null;
    },

    async list(status?: ReportRow["status"]): Promise<ReportRow[]> {
      const query = db.select().from(reports).orderBy(desc(reports.createdAt));
      return status ? query.where(eq(reports.status, status)) : query;
    },

    async update(id: string, values: Partial<ReportInsert>): Promise<void> {
      await db.update(reports).set(values).where(eq(reports.id, id));
    },

    async insertEvidence(values: Array<typeof reportEvidence.$inferInsert>): Promise<void> {
      if (values.length === 0) {
        return;
      }
      await db.insert(reportEvidence).values(values);
    },

    async listEvidence(reportId: string): Promise<ReportEvidenceRow[]> {
      return db
        .select()
        .from(reportEvidence)
        .where(and(eq(reportEvidence.reportId, reportId), isNotNull(reportEvidence.confirmedAt)))
        .orderBy(reportEvidence.createdAt);
    },

    async listUnconfirmedEvidence(reportId: string): Promise<ReportEvidenceRow[]> {
      return db
        .select()
        .from(reportEvidence)
        .where(and(eq(reportEvidence.reportId, reportId), isNull(reportEvidence.confirmedAt)));
    },

    async findEvidence(id: string): Promise<ReportEvidenceRow | null> {
      const [row] = await db
        .select()
        .from(reportEvidence)
        .where(eq(reportEvidence.id, id))
        .limit(1);
      return row ?? null;
    },

    async confirmEvidence(
      id: string,
      values: { storageKey: string; confirmedAt: Date },
    ): Promise<void> {
      await db.update(reportEvidence).set(values).where(eq(reportEvidence.id, id));
    },

    async deleteEvidence(id: string): Promise<void> {
      await db.delete(reportEvidence).where(eq(reportEvidence.id, id));
    },

    async listUnconfirmedBefore(cutoff: Date): Promise<ReportEvidenceRow[]> {
      return db
        .select()
        .from(reportEvidence)
        .where(and(isNull(reportEvidence.confirmedAt), lt(reportEvidence.createdAt, cutoff)));
    },

    async listEvidenceOfReportsClosedBefore(cutoff: Date): Promise<ReportEvidenceRow[]> {
      const rows = await db
        .select({ evidence: reportEvidence })
        .from(reportEvidence)
        .innerJoin(reports, eq(reports.id, reportEvidence.reportId))
        .where(
          and(inArray(reports.status, ["resolved", "dismissed"]), lt(reports.respondedAt, cutoff)),
        );
      return rows.map((row) => row.evidence);
    },

    async countEvidence(reportIds: string[]): Promise<Map<string, number>> {
      const result = new Map<string, number>();
      if (reportIds.length === 0) {
        return result;
      }
      const rows = await db
        .select({ reportId: reportEvidence.reportId, total: count() })
        .from(reportEvidence)
        .where(
          and(inArray(reportEvidence.reportId, reportIds), isNotNull(reportEvidence.confirmedAt)),
        )
        .groupBy(reportEvidence.reportId);
      for (const row of rows) {
        result.set(row.reportId, row.total);
      }
      return result;
    },

    async insertBlockedHash(values: typeof blockedImageHashes.$inferInsert): Promise<void> {
      await db.insert(blockedImageHashes).values(values);
    },

    async listBlockedHashes(): Promise<Array<{ hash: string; reportId: string }>> {
      return db
        .select({ hash: blockedImageHashes.hash, reportId: blockedImageHashes.reportId })
        .from(blockedImageHashes);
    },

    async claimUnnotified(claimedAt: Date): Promise<ReportRow[]> {
      return db
        .update(reports)
        .set({ adminNotifiedAt: claimedAt })
        .where(isNull(reports.adminNotifiedAt))
        .returning();
    },

    async releaseClaim(ids: string[], claimedAt: Date): Promise<void> {
      if (ids.length === 0) {
        return;
      }
      await db
        .update(reports)
        .set({ adminNotifiedAt: null })
        .where(and(inArray(reports.id, ids), eq(reports.adminNotifiedAt, claimedAt)));
    },
  };
}
