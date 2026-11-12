import { pgTable, smallint, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const contactVerificationChannels = pgTable(
  "verification_channel",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text({ enum: ["email", "phone"] }).notNull(),
    target: text().notNull(),
    codeHash: text(),
    codeSentAt: timestamp({ withTimezone: true }),
    expiresAt: timestamp({ withTimezone: true }),
    attempts: smallint().notNull().default(0),
    verifiedAt: timestamp({ withTimezone: true }),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("verification_channel_user_channel_key").on(table.userId, table.channel)],
);
