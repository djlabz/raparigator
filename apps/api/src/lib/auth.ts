import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { AppConfig } from "../config";
import type { Database } from "../db/client";
import * as schema from "../db/schema";
import type { Mailer } from "./mail";
import { newId } from "./ids";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;

function cookieOptions(config: AppConfig) {
  return {
    useSecureCookies: config.isProduction,
    ...(config.COOKIE_DOMAIN
      ? { crossSubDomainCookies: { enabled: true, domain: config.COOKIE_DOMAIN } }
      : {}),
  };
}

export function createUserAuth(db: Database, config: AppConfig, mailer?: Mailer) {
  return betterAuth({
    appName: "Sigillus",
    baseURL: config.API_ORIGIN,
    basePath: "/api/auth",
    secret: config.AUTH_SECRET,
    trustedOrigins: config.corsOrigins,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, token }) => {
        if (!mailer) {
          return;
        }
        const resetUrl = `${config.WEB_ORIGIN}/auth/redefinir-senha?token=${token}`;
        await mailer.send({
          to: user.email,
          subject: "Redefinição de senha — Sigillus",
          text: `Olá ${user.name || ""},\n\nRecebemos uma solicitação para redefinir a senha da sua conta no Sigillus.\n\nAcesse o link abaixo para criar uma nova senha:\n${resetUrl}\n\nO link é válido por 1 hora. Se você não solicitou a alteração, ignore esta mensagem.`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
  <h2 style="color: #722f37;">Sigillus</h2>
  <p>Olá <strong>${user.name || ""}</strong>,</p>
  <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
  <p style="margin: 24px 0;">
    <a href="${resetUrl}" style="background-color: #722f37; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Redefinir minha senha</a>
  </p>
  <p style="font-size: 13px; color: #71717a;">Ou copie o link: <br/><a href="${resetUrl}">${resetUrl}</a></p>
  <p style="font-size: 12px; color: #a1a1aa; margin-top: 32px;">Se você não solicitou este e-mail, pode ignorá-lo com segurança.</p>
</div>`,
        });
      },
    },
    user: {
      additionalFields: {
        role: {
          type: ["cliente", "profissional"],
          required: false,
          defaultValue: "cliente",
          input: true,
        },
        cpf: { type: "string", required: false, input: true },
        phone: { type: "string", required: false, input: true },
        phoneVerified: { type: "boolean", required: false, defaultValue: false, input: false },
        city: { type: "string", required: false, input: true },
        alias: { type: "string", required: false, input: true },
        status: {
          type: ["active", "suspended"],
          required: false,
          defaultValue: "active",
          input: false,
        },
        suspensionReason: { type: "string", required: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const role = (user as { role?: unknown }).role ?? "cliente";
            if (role !== "cliente" && role !== "profissional") {
              throw new APIError("BAD_REQUEST", { message: "Papel inválido." });
            }
            return { data: { ...user, role } };
          },
        },
      },
    },
    session: {
      expiresIn: SESSION_MAX_AGE_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: config.RATE_LIMIT_ENABLED,
      window: 60,
      max: 30,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
      },
    },
    advanced: {
      cookiePrefix: "sigillus",
      database: { generateId: () => newId() },
      ...cookieOptions(config),
    },
  });
}

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

export type UserAuth = ReturnType<typeof createUserAuth>;
export type AdminAuth = ReturnType<typeof createAdminAuth>;
export type UserSession = NonNullable<Awaited<ReturnType<UserAuth["api"]["getSession"]>>>;
export type AdminSession = NonNullable<Awaited<ReturnType<AdminAuth["api"]["getSession"]>>>;
