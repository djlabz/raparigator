import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import * as schema from "../../db/schema";
import { newId } from "../../lib/ids";
import { cookieOptions } from "./cookie-options";

export function createAdminAuth(db: Database, config: AppConfig) {
  return betterAuth({
    appName: "Sigillus Admin",
    baseURL: config.API_ORIGIN,
    basePath: "/api/admin-auth",
    secret: config.AUTH_SECRET,
    trustedOrigins: config.corsOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.adminUsers,
        session: schema.adminSessions,
        account: schema.adminAccounts,
        verification: schema.adminVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      disableSignUp: true,
    },
    session: {
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: config.RATE_LIMIT_ENABLED,
      window: 60,
      max: 20,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "sigillus-admin",
      database: { generateId: () => newId() },
      ...cookieOptions(config),
    },
  });
}

export type AdminAuth = ReturnType<typeof createAdminAuth>;
export type AdminSession = NonNullable<Awaited<ReturnType<AdminAuth["api"]["getSession"]>>>;
