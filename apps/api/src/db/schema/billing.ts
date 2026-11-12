import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const subscriptions = pgTable(
  "subscription",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text().notNull(),
    providerRef: text(),
    cycle: text({ enum: ["monthly", "semiannual"] }).notNull(),
    status: text({
      enum: ["none", "pending_payment", "active", "past_due", "canceled", "expired"],
    })
      .notNull()
      .default("pending_payment"),
    currentPeriodStart: timestamp({ withTimezone: true }),
    currentPeriodEnd: timestamp({ withTimezone: true }),
    cancelAtPeriodEnd: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("subscription_user_idx").on(table.userId, table.createdAt),
    index("subscription_status_period_idx").on(table.status, table.currentPeriodEnd),
  ],
);

export const subscriptionEvents = pgTable(
  "subscription_event",
  {
    id: text().primaryKey(),
    subscriptionId: text()
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    type: text({
      enum: [
        "checkout_created",
        "payment_confirmed",
        "payment_failed",
        "renewed",
        "cancel_requested",
        "canceled",
        "expired",
      ],
    }).notNull(),
    idempotencyKey: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("subscription_event_idempotency_key").on(table.idempotencyKey),
    index("subscription_event_subscription_idx").on(table.subscriptionId, table.occurredAt),
  ],
);

export const webhookDeliveries = pgTable(
  "webhook_delivery",
  {
    id: text().primaryKey(),
    provider: text().notNull(),
    externalId: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull(),
    receivedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp({ withTimezone: true }),
    error: text(),
  },
  (table) => [
    uniqueIndex("webhook_delivery_provider_external_key").on(table.provider, table.externalId),
  ],
);
