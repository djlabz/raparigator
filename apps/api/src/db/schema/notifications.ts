import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const notifications = pgTable(
  "notification",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text().notNull(),
    title: text().notNull(),
    message: text().notNull(),
    href: text(),
    readAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("notification_user_key").on(table.userId, table.key),
    index("notification_user_created_idx").on(table.userId, table.createdAt),
  ],
);
