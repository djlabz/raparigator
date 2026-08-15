import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { BillingProvider } from "./lib/billing/provider";
import type { ChatEventBus } from "./lib/chat-events";
import type { JobQueue } from "./lib/jobs";
import type { Logger } from "./lib/logger";
import type { ObjectStorage } from "./lib/storage";
import { createAdsService } from "./modules/ads/service";
import { createCatalogsService } from "./modules/catalogs/service";
import { createFeedService } from "./modules/feed/service";
import { createNotificationsService } from "./modules/notifications/service";
import { createProfileRepository } from "./modules/profiles/repository";

export type ServiceDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
  storage: ObjectStorage;
  jobs: JobQueue;
  chatEvents: ChatEventBus;
  billing: BillingProvider;
};

export type Services = ReturnType<typeof createServices>;

export function createServices(deps: ServiceDeps) {
  const { db, logger, storage, jobs, chatEvents } = deps;
  const profiles = createProfileRepository(db, storage);
  const notifications = createNotificationsService({ db });
  return {
    profiles,
    notifications,
    catalogs: createCatalogsService(db),
    feed: createFeedService(profiles),
    ads: createAdsService(db, profiles),
  };
}
