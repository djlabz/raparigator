import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { Logger } from "./lib/logger";
import type { RateLimiter } from "./lib/rate-limit";
import type { Services } from "./services";

export type AppDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
  rateLimiter: RateLimiter;
  services: Services;
  ready: () => boolean;
};
