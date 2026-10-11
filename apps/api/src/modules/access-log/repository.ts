import { and, count, desc, eq, gte, lt, lte, type SQL } from "drizzle-orm";
import type { AccessLog, AccessLogEvent, AccessLogsInput } from "@sigillus/contracts";
import type { Database } from "../../db/client";
import { accessLogs, adminSessions, sessions } from "../../db/schema";

export type NewAccessLog = {
  id: string;
  userId: string;
  event: AccessLogEvent;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
};

export async function insertAccessLog(db: Database, row: NewAccessLog) {
  await db.insert(accessLogs).values(row);
}

export async function deleteAccessLogsBefore(db: Database, cutoff: Date) {
  const deleted = await db
    .delete(accessLogs)
    .where(lt(accessLogs.createdAt, cutoff))
    .returning({ id: accessLogs.id });
  return deleted.length;
}

export async function deleteSessionsExpiredBefore(db: Database, cutoff: Date) {
  const [userRows, adminRows] = await Promise.all([
    db.delete(sessions).where(lt(sessions.expiresAt, cutoff)).returning({ id: sessions.id }),
    db
      .delete(adminSessions)
      .where(lt(adminSessions.expiresAt, cutoff))
      .returning({ id: adminSessions.id }),
  ]);
  return { sessions: userRows.length, adminSessions: adminRows.length };
}

export async function listAccessLogs(db: Database, input: AccessLogsInput) {
  const filters: SQL[] = [];
  if (input.userId) {
    filters.push(eq(accessLogs.userId, input.userId));
  }
  if (input.from) {
    filters.push(gte(accessLogs.createdAt, new Date(input.from)));
  }
  if (input.to) {
    filters.push(lte(accessLogs.createdAt, new Date(input.to)));
  }
  const where = filters.length > 0 ? and(...filters) : undefined;
  const offset = (input.page - 1) * input.pageSize;
  const [rows, [total]] = await Promise.all([
    db
      .select()
      .from(accessLogs)
      .where(where)
      .orderBy(desc(accessLogs.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db.select({ total: count() }).from(accessLogs).where(where),
  ]);
  const items: AccessLog[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    event: row.event,
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  }));
  return { items, total: total?.total ?? 0, page: input.page, pageSize: input.pageSize };
}
