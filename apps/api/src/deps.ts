import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { AdminAuth, UserAuth } from "./lib/auth";
import type { Logger } from "./lib/logger";
import type { RateLimiter } from "./lib/rate-limit";
import type { Services } from "./services";

export type AppDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
  auth: UserAuth;
  adminAuth: AdminAuth;
  rateLimiter: RateLimiter;
  services: Services;
  ready: () => boolean;
};
