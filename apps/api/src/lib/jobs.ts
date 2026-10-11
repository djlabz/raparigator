import { PgBoss, type QueuePolicy } from "pg-boss";
import type { AccessLogEvent } from "@sigillus/contracts";
import type { Logger } from "./logger";

export type JobPayloads = {
  "media.process": { assetId: string };
  "media.moderate": { assetId: string };
  "review-invite.expire": { inviteId: string };
  "billing.webhook": { deliveryId: string };
  "premium.expire": Record<string, never>;
  "admin.review-digest": Record<string, never>;
  "admin.report-digest": Record<string, never>;
  "access-log.record": {
    userId: string;
    event: AccessLogEvent;
    ip: string | null;
    userAgent: string | null;
    occurredAt: string;
  };
  "access-log.purge": Record<string, never>;
  "session.purge": Record<string, never>;
};

export type JobName = keyof JobPayloads;

export const JOB_QUEUE_POLICIES: Partial<Record<JobName, QueuePolicy>> = {
  "admin.review-digest": "short",
  "admin.report-digest": "short",
};

export type JobHandler<TName extends JobName> = (payload: JobPayloads[TName]) => Promise<void>;

export interface JobQueue {
  schedule(name: JobName, cron: string): Promise<void>;
  enqueue<TName extends JobName>(
    name: TName,
    payload: JobPayloads[TName],
    options?: { startAfter?: Date; singletonKey?: string },
  ): Promise<void>;
  work<TName extends JobName>(name: TName, handler: JobHandler<TName>): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export function createPgBossQueue(databaseUrl: string, logger: Logger): JobQueue {
  const boss = new PgBoss({ connectionString: databaseUrl, schema: "pgboss" });
  boss.on("error", (error) => logger.error({ err: error }, "pg-boss"));
  let started = false;
  const ensureQueue = (name: JobName) => {
    const policy = JOB_QUEUE_POLICIES[name];
    return boss.createQueue(name, policy ? { policy } : undefined).catch(() => undefined);
  };

  return {
    async start() {
      if (!started) {
        await boss.start();
        started = true;
      }
    },
    async stop() {
      if (started) {
        await boss.stop({ graceful: true });
        started = false;
      }
    },
    async schedule(name, cron) {
      await ensureQueue(name);
      await boss.schedule(name, cron, {}, { retryLimit: 1 });
    },
    async enqueue(name, payload, options) {
      await ensureQueue(name);
      await boss.send(name, payload, {
        retryLimit: 5,
        retryDelay: 30,
        retryBackoff: true,
        ...(options?.startAfter ? { startAfter: options.startAfter } : {}),
        ...(options?.singletonKey ? { singletonKey: options.singletonKey } : {}),
      });
    },
    async work(name, handler) {
      await ensureQueue(name);
      await boss.work(name, async (jobs) => {
        for (const job of jobs) {
          await handler(job.data as never);
        }
      });
    },
  };
}

type DelayedJob = { name: JobName; payload: unknown; singletonKey?: string };

export function createInlineQueue(logger?: Logger): JobQueue & {
  enqueued: Array<{ name: JobName; payload: unknown }>;
  delayed: DelayedJob[];
  runDelayed(): Promise<void>;
  clearDelayed(): void;
} {
  const handlers = new Map<JobName, JobHandler<JobName>>();
  const enqueued: Array<{ name: JobName; payload: unknown }> = [];
  const delayed: DelayedJob[] = [];

  async function run(name: JobName, payload: unknown) {
    const handler = handlers.get(name);
    if (!handler) {
      return;
    }
    try {
      await handler(payload as never);
    } catch (error) {
      logger?.error({ err: error, job: name }, "job inline falhou");
    }
  }

  return {
    enqueued,
    delayed,
    async schedule() {},
    async start() {},
    async stop() {},
    async enqueue(name, payload, options) {
      enqueued.push({ name, payload });
      if (options?.startAfter && options.startAfter.getTime() > Date.now()) {
        const singletonKey = options.singletonKey;
        const isShort = JOB_QUEUE_POLICIES[name] === "short";
        const alreadyQueued = delayed.some(
          (job) => job.name === name && job.singletonKey === singletonKey,
        );
        if (!(isShort && alreadyQueued)) {
          delayed.push({ name, payload, singletonKey });
        }
        return;
      }
      await run(name, payload);
    },
    async work(name, handler) {
      handlers.set(name, handler as JobHandler<JobName>);
    },
    async runDelayed() {
      const due = delayed.splice(0, delayed.length);
      for (const job of due) {
        await run(job.name, job.payload);
      }
    },
    clearDelayed() {
      delayed.length = 0;
    },
  };
}
