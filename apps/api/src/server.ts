import { serve } from "@hono/node-server";
import { getConfig } from "./config";
import { createApp } from "./app";
import { createDatabase } from "./db/client";
import { runMigrations } from "./db/migrate";
import { getLogger } from "./lib/logger";
import { MemoryRateLimiter, NoopRateLimiter } from "./lib/rate-limit";
import { initSentry } from "./lib/sentry";
import { createServices } from "./services";
import type { AppDeps } from "./deps";

async function main() {
  const config = getConfig();
  const logger = getLogger();
  initSentry(config);

  if (config.MIGRATE_ON_BOOT) {
    await runMigrations();
    logger.info("migrations aplicadas no boot");
  }

  const { db, pool } = createDatabase(config);
  let ready = false;

  const deps: AppDeps = {
    config,
    db,
    logger,
    rateLimiter: config.RATE_LIMIT_ENABLED ? new MemoryRateLimiter() : new NoopRateLimiter(),
    services: createServices({ config, db, logger }),
    ready: () => ready,
  };

  const app = createApp(deps);
  const server = serve({ fetch: app.fetch, port: config.PORT, hostname: config.HOST }, (info) => {
    ready = true;
    logger.info({ port: info.port, host: config.HOST, env: config.NODE_ENV }, "API no ar");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "encerrando");
    ready = false;
    server.close();
    await pool.end();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  getLogger().fatal({ err: error }, "falha ao subir a API");
  process.exit(1);
});
