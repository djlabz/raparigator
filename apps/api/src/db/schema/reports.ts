import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { conversations } from "./chat";
import { professionalProfiles } from "./profiles";

export const reports = pgTable(
  "report",
  {
    id: text().primaryKey(),
    source: text({ enum: ["chat", "public"] })
      .notNull()
      .default("chat"),
    type: text({ enum: ["fake_profile", "scam", "harassment", "inappropriate_content", "other"] })
      .notNull()
      .default("other"),
    reason: text({
      enum: ["photo_without_consent", "minor", "coercion", "illegal_content", "other"],
    }),
    reporterUserId: text().references(() => users.id, { onDelete: "set null" }),
    reporterName: text(),
    reporterRole: text({ enum: ["cliente", "profissional"] }),
    reportedUserId: text().references(() => users.id, { onDelete: "set null" }),
    reportedName: text(),
    reportedRole: text({ enum: ["cliente", "profissional"] }),
    conversationId: text().references(() => conversations.id, { onDelete: "set null" }),
    targetProfileId: text().references(() => professionalProfiles.id, { onDelete: "set null" }),
    targetUrl: text(),
    profileSlug: text(),
    contactEmail: text(),
    description: text().notNull(),
    status: text({ enum: ["pending", "under_review", "resolved", "dismissed"] })
      .notNull()
      .default("pending"),
    resolution: text(),
    action: text({ enum: ["remove_media", "unpublish_profile", "dismiss"] }),
    actionTargetId: text(),
    actionAdminId: text(),
    actionAdminEmail: text(),
    respondedAt: timestamp({ withTimezone: true }),
    adminNotifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }),
  },
  (table) => [index("report_status_idx").on(table.status, table.createdAt)],
);

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
