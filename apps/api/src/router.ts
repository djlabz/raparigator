import { adsRouter } from "./modules/ads/router";
import { announcementsRouter } from "./modules/announcements/router";
import { authRouter } from "./modules/auth/router";
import { catalogsRouter } from "./modules/catalogs/router";
import { chatRouter } from "./modules/chat/router";
import { feedRouter } from "./modules/feed/router";
import { mediaRouter } from "./modules/media/router";
import { notificationsRouter } from "./modules/notifications/router";

export const router = {
  auth: authRouter,
  catalogs: catalogsRouter,
  feed: feedRouter,
  ads: adsRouter,
  announcements: announcementsRouter,
  media: mediaRouter,
  chat: chatRouter,
  notifications: notificationsRouter,
};

export type AppRouter = typeof router;
