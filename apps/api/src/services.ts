import type { AppConfig } from "./config";
import type { Database } from "./db/client";
import type { BillingProvider } from "./lib/billing/provider";
import type { ChatEventBus } from "./lib/chat-events";
import type { JobQueue } from "./lib/jobs";
import type { Logger } from "./lib/logger";
import type { Mailer } from "./lib/mail";
import type { ObjectStorage } from "./lib/storage";
import { createAdminService } from "./modules/admin/service";
import { createAdsService } from "./modules/ads/service";
import { createAuthService } from "./modules/auth/service";
import { createAnnouncementsService } from "./modules/announcements/service";
import { createCatalogsService } from "./modules/catalogs/service";
import { createChatService } from "./modules/chat/service";
import { createFeedService } from "./modules/feed/service";
import { createIdentityService } from "./modules/identity/service";
import { createMediaService } from "./modules/media/service";
import { createNotificationsService } from "./modules/notifications/service";
import { createPremiumService } from "./modules/premium/service";
import { createProfileRepository } from "./modules/profiles/repository";
import { createReportsService } from "./modules/reports/service";
import { createReviewsService } from "./modules/reviews/service";
import { createVerificationService } from "./modules/verification/service";
import { createAccessLogService } from "./modules/access-log/service";
import { createReportsRepository } from "./modules/reports/repository";
import { createMediaRepository } from "./modules/media/repository";
import { createChatRepository } from "./modules/chat/repository";

export type ServiceDeps = {
  config: AppConfig;
  db: Database;
  logger: Logger;
  storage: ObjectStorage;
  jobs: JobQueue;
  chatEvents: ChatEventBus;
  billing: BillingProvider;
  mailer?: Mailer;
};

export type Services = ReturnType<typeof createServices>;

export function createServices(deps: ServiceDeps) {
  const { db, logger, storage, jobs, chatEvents, billing, config, mailer } = deps;
  const profiles = createProfileRepository(db, storage);
  const notifications = createNotificationsService({ db });
  const premium = createPremiumService({ db, billing, config, jobs, logger });
  const reports = createReportsService({ db, storage, jobs, logger, profiles });
  const identity = createIdentityService({ db, storage, jobs, logger, config });
  return {
    profiles,
    notifications,
    auth: createAuthService({
      db,
      jobs,
      logger,
      uploadTtlSeconds: config.MEDIA_UPLOAD_TTL_SECONDS,
      chat: createChatRepository(db),
      identity,
    }),
    accessLog: createAccessLogService(db),
    catalogs: createCatalogsService(db),
    feed: createFeedService(profiles),
    ads: createAdsService(db, profiles),
    announcements: createAnnouncementsService({
      db,
      profiles,
      jobs,
      logger,
      identityGate: (userId) => identity.publishGate(userId),
    }),
    media: createMediaService({ db, profiles, storage, jobs, logger }),
    reports,
    identity,
    chat: createChatService({ db, profiles, storage, chatEvents, logger, reports }),
    reviews: createReviewsService({ db, profiles, notifications, jobs, logger }),
    premium,
    verification: createVerificationService({ db, config, logger, mailer }),
    admin: createAdminService({
      db,
      profiles,
      storage,
      logger,
      premium,
      notify: notifications.push,
      reportsRepo: createReportsRepository(db),
      mediaRepo: createMediaRepository(db),
    }),
  };
}
