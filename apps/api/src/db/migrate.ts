import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getConfig } from "../config";
import { getLogger } from "../lib/logger";
import { createDatabase } from "./client";

export async function runMigrations(databaseUrl?: string) {
  const config = getConfig();
  const { db, pool } = createDatabase({
    DATABASE_URL: databaseUrl ?? config.DATABASE_URL,
    DATABASE_POOL_MAX: 1,
  });
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.resolve(process.cwd(), "drizzle");
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      getLogger().info("migrations aplicadas");
      process.exit(0);
    })
    .catch((error) => {
      getLogger().error({ err: error }, "falha ao aplicar migrations");
      process.exit(1);
    });
}
