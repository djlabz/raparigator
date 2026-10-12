import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const identityVerifications = pgTable(
  "identity_verification",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text({ enum: ["pending", "approved", "rejected"] })
      .notNull()
      .default("pending"),
    documentKey: text(),
    selfieKey: text(),
    reviewedBy: text(),
    reviewedAt: timestamp({ withTimezone: true }),
    rejectReason: text(),
    filesDeletedAt: timestamp({ withTimezone: true }),
    adminNotifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("identity_verification_active_user_key")
      .on(table.userId)
      .where(sql`${table.status} <> 'rejected'`),
    index("identity_verification_user_idx").on(table.userId, table.createdAt),
    index("identity_verification_status_idx").on(table.status, table.createdAt),
  ],
);
