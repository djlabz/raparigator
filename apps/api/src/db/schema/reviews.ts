import {
  boolean,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { conversations } from "./chat";
import { professionalProfiles } from "./profiles";

export const reviewInvites = pgTable(
  "review_invite",
  {
    id: text().primaryKey(),
    conversationId: text()
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    profileId: text()
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    clientUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("review_invite_conversation_key").on(table.conversationId),
    index("review_invite_client_idx").on(table.clientUserId),
    index("review_invite_expires_idx").on(table.expiresAt),
  ],
);

export const reviews = pgTable(
  "review",
  {
    id: text().primaryKey(),
    profileId: text()
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    conversationId: text().references(() => conversations.id, { onDelete: "set null" }),
    authorUserId: text().references(() => users.id, { onDelete: "set null" }),
    authorName: text().notNull(),
    score: smallint().notNull(),
    comment: text().notNull().default(""),
    isSeed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("review_profile_idx").on(table.profileId, table.createdAt),
    uniqueIndex("review_conversation_key").on(table.conversationId),
  ],
);
