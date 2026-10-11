import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const accessLogs = pgTable(
  "access_log",
  {
    id: text().primaryKey(),
    userId: text().notNull(),
    event: text({
      enum: [
        "login",
        "logout",
        "signup",
        "profile_publish",
        "media_upload",
        "report_create",
        "account_delete",
      ],
    }).notNull(),
    ip: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("access_log_created_idx").on(table.createdAt),
    index("access_log_user_idx").on(table.userId, table.createdAt),
  ],
);
