import { fileURLToPath } from "node:url";
import { getConfig } from "../../config";
import { getLogger } from "../../lib/logger";
import { createDatabase } from "../client";
import { seedCatalogs } from "./catalogs";
import { seedDevData } from "./dev-data";
import { seedDevUsers } from "./users";

export async function runSeeds(options: { devData?: boolean } = {}) {
  const config = getConfig();
  const { db, pool } = createDatabase({ DATABASE_URL: config.DATABASE_URL, DATABASE_POOL_MAX: 2 });
  try {
    await seedCatalogs(db);
    if (options.devData ?? !config.isProduction) {
      await seedDevUsers(db);
      await seedDevData(db);
    }
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds()
    .then(() => {
      getLogger().info("seeds aplicadas");
      process.exit(0);
    })
    .catch((error) => {
      getLogger().error({ err: error }, "falha ao aplicar seeds");
      process.exit(1);
    });
}
