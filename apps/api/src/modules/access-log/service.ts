import type { AccessLogEvent } from "@sigillus/contracts";
import type { Database } from "../../db/client";
import { newId } from "../../lib/ids";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import { resolveClientIp } from "../../orpc/context";
import { deleteAccessLogsBefore, deleteSessionsExpiredBefore, insertAccessLog } from "./repository";

export const ACCESS_LOG_RETENTION_DAYS = 180;
export const SESSION_PURGE_GRACE_DAYS = 30;
const ACCESS_LOG_USER_AGENT_MAX_LENGTH = 256;
const ACCESS_LOG_PURGE_CRON = "0 3 * * *";
const SESSION_PURGE_CRON = "30 3 * * *";

const DAY_MS = 24 * 60 * 60 * 1000;

export type RecordAccessInput = {
  userId: string;
  event: AccessLogEvent;
  headers?: Headers | null;
};

export async function recordAccess(jobs: JobQueue, input: RecordAccessInput) {
  const headers = input.headers ?? null;
  const ip = headers ? resolveClientIp(headers, "") : "";
  const userAgent = headers?.get("user-agent")?.slice(0, ACCESS_LOG_USER_AGENT_MAX_LENGTH) ?? "";
  await jobs.enqueue("access-log.record", {
    userId: input.userId,
    event: input.event,
    ip: ip || null,
    userAgent: userAgent || null,
    occurredAt: new Date().toISOString(),
  });
}

export function purgeExpiredAccessLogs(db: Database, now = new Date()) {
  return deleteAccessLogsBefore(db, new Date(now.getTime() - ACCESS_LOG_RETENTION_DAYS * DAY_MS));
}

export function purgeExpiredSessions(db: Database, now = new Date()) {
  return deleteSessionsExpiredBefore(
    db,
    new Date(now.getTime() - SESSION_PURGE_GRACE_DAYS * DAY_MS),
  );
}

export async function registerAccessLogJobs(deps: {
  db: Database;
  jobs: JobQueue;
  logger: Logger;
}) {
  const { db, jobs, logger } = deps;
  await jobs.work("access-log.record", async (payload) => {
    const id = newId();
    await insertAccessLog(db, {
      id,
      userId: payload.userId,
      event: payload.event,
      ip: payload.ip,
      userAgent: payload.userAgent?.slice(0, ACCESS_LOG_USER_AGENT_MAX_LENGTH) ?? null,
      createdAt: new Date(payload.occurredAt),
    });
    logger.info({ accessLogId: id, event: payload.event }, "registro de acesso gravado");
  });
  await jobs.work("access-log.purge", async () => {
    const deleted = await purgeExpiredAccessLogs(db);
    logger.info({ deleted }, "registros de acesso expirados apagados");
  });
  await jobs.work("session.purge", async () => {
    const deleted = await purgeExpiredSessions(db);
    logger.info(deleted, "sessões expiradas apagadas");
  });
  await jobs.schedule("access-log.purge", ACCESS_LOG_PURGE_CRON);
  await jobs.schedule("session.purge", SESSION_PURGE_CRON);
}
