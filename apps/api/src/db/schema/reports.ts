import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { reports } from "./social";

export const reportEvidence = pgTable(
  "report_evidence",
  {
    id: text().primaryKey(),
    reportId: text()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    storageKey: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: integer().notNull(),
    confirmedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("report_evidence_report_idx").on(table.reportId)],
);

export const blockedImageHashes = pgTable(
  "blocked_image_hash",
  {
    id: text().primaryKey(),
    hash: text().notNull(),
    reportId: text()
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sourceAssetId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("blocked_image_hash_report_idx").on(table.reportId)],
);
