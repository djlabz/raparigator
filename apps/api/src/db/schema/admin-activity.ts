import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminActivityLogs = pgTable(
  "admin_activity_log",
  {
    id: text().primaryKey(),
    action: text({
      enum: [
        "profile_approved",
        "profile_rejected",
        "profile_submitted",
        "client_registered",
        "account_suspended",
        "account_reinstated",
        "premium_granted",
      ],
    }).notNull(),
    targetName: text().notNull(),
    targetId: text(),
    adminEmail: text(),
    reason: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("admin_activity_log_created_idx").on(table.createdAt)],
);
