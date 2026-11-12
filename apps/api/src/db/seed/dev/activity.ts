import type { Database } from "../../client";
import { adminActivityLogs } from "../../schema";
import { fixtures } from "./fixtures";

export async function seedAdminActivity(db: Database) {
  for (const entry of fixtures.adminActivityLog) {
    await db
      .insert(adminActivityLogs)
      .values({
        id: `seed-activity-${entry.id}`,
        action: entry.action,
        targetName: entry.targetName,
        targetId: entry.targetId ?? null,
        adminEmail: entry.adminEmail ?? null,
        reason: entry.reason ?? null,
        createdAt: new Date(entry.timestamp),
      })
      .onConflictDoNothing();
  }
}
