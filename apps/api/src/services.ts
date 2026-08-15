import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { Logger } from "./lib/logger";

export type ServiceDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
};

export type Services = ReturnType<typeof createServices>;

export function createServices(_deps: ServiceDeps) {
  return {};
}
