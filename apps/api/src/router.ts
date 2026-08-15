import { adsRouter } from "./modules/ads/router";
import { authRouter } from "./modules/auth/router";
import { catalogsRouter } from "./modules/catalogs/router";
import { feedRouter } from "./modules/feed/router";

export const router = {
  auth: authRouter,
  catalogs: catalogsRouter,
  feed: feedRouter,
  ads: adsRouter,
};

export type AppRouter = typeof router;
