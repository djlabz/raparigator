import { getConfig } from "../config";
import { runSeeds } from "../db/seed";
import { getLogger } from "../lib/logger";
import { createS3Storage } from "../lib/storage";

runSeeds(createS3Storage(getConfig()))
  .then(() => {
    getLogger().info("seeds aplicadas");
    process.exit(0);
  })
  .catch((error) => {
    getLogger().error({ err: error }, "falha ao aplicar seeds");
    process.exit(1);
  });
