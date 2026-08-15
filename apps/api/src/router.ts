import { authRouter } from "./modules/auth/router";

export const router = {
  auth: authRouter,
};

export type AppRouter = typeof router;
