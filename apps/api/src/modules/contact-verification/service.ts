import { createHash, randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import type {
  ContactVerificationChannel,
  ContactVerificationChannelState,
  ContactVerificationState,
} from "@sigillus/contracts";
import { validatePhone } from "@sigillus/domain";
import type { AppConfig } from "../../config";
import type { Database } from "../../db/client";
import { users, contactVerificationChannels } from "../../db/schema";
import { newId } from "../../lib/ids";
import type { Logger } from "../../lib/logger";
import type { Mailer } from "../../lib/mail";

const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const VERIFICATION_MAX_ATTEMPTS = 5;

export interface ContactVerificationNotifier {
  sendCode(channel: ContactVerificationChannel, target: string, code: string): Promise<void>;
}

export type ContactVerificationServiceDeps = {
  db: Database;
  config: AppConfig;
  logger: Logger;
  notifier?: ContactVerificationNotifier;
  mailer?: Mailer;
};

export type ContactVerificationUser = { id: string; email: string; phone: string | null };

type ChannelRow = typeof contactVerificationChannels.$inferSelect;

const EXPIRED_MESSAGE = "O código expirou. Envie outro para continuar.";
const INVALID_MESSAGE = "Código inválido. Verifique e tente novamente.";

function normalizeTarget(value: string) {
  return value.trim().toLowerCase();
}

function targetFor(user: ContactVerificationUser, channel: ContactVerificationChannel): string {
  return channel === "email" ? user.email : (user.phone ?? "");
}

function hashCode(userId: string, channel: ContactVerificationChannel, code: string): string {
  return createHash("sha256").update(`${userId}:${channel}:${code}`).digest("hex");
}

function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function emptyChannelState(target: string): ContactVerificationChannelState {
  return {
    target,
    verified: false,
    verifiedAt: null,
    codeSentAt: null,
    expiresAt: null,
    attempts: 0,
  };
}

function toPublicChannelState(
  row: ChannelRow | null,
  target: string,
  now: Date,
): ContactVerificationChannelState {
  if (!row || normalizeTarget(row.target) !== normalizeTarget(target)) {
    return emptyChannelState(target);
  }
  const codeAlive = Boolean(
    row.codeHash && row.expiresAt && row.expiresAt.getTime() > now.getTime(),
  );
  return {
    target,
    verified: row.verifiedAt !== null,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    codeSentAt: codeAlive ? (row.codeSentAt?.toISOString() ?? null) : null,
    expiresAt: codeAlive ? (row.expiresAt?.toISOString() ?? null) : null,
    attempts: row.attempts,
  };
}

function createLoggingVerificationNotifier(logger: Logger): ContactVerificationNotifier {
  return {
    async sendCode(channel) {
      logger.info({ channel }, "código de verificação enviado");
    },
  };
}

function createEmailVerificationNotifier(
  mailer: Mailer,
  logger: Logger,
): ContactVerificationNotifier {
  return {
    async sendCode(channel, target, code) {
      if (channel === "email") {
        await mailer.send({
          kind: "verification-code",
          to: target,
          subject: "Seu código de confirmação — Sigillus",
          text: `Seu código de confirmação no Sigillus é: ${code}\n\nEste código expira em 10 minutos.`,
          html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #18181b;">
  <h2 style="color: #722f37;">Sigillus</h2>
  <p>Seu código de confirmação de e-mail é:</p>
  <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #722f37; padding: 16px 0;">
    ${code}
  </div>
  <p style="font-size: 13px; color: #71717a;">Este código é válido por 10 minutos. Se você não solicitou, ignore esta mensagem.</p>
</div>`,
        });
        return;
      }
      logger.info({ channel }, "código de verificação enviado");
    },
  };
}

export function createContactVerificationService(deps: ContactVerificationServiceDeps) {
  const { db, config, logger } = deps;
  const notifier =
    deps.notifier ??
    (deps.mailer
      ? createEmailVerificationNotifier(deps.mailer, logger)
      : createLoggingVerificationNotifier(logger));

  async function findRow(
    userId: string,
    channel: ContactVerificationChannel,
  ): Promise<ChannelRow | null> {
    const [row] = await db
      .select()
      .from(contactVerificationChannels)
      .where(
        and(
          eq(contactVerificationChannels.userId, userId),
          eq(contactVerificationChannels.channel, channel),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async function clearCode(id: string, attempts?: number) {
    await db
      .update(contactVerificationChannels)
      .set({
        codeHash: null,
        codeSentAt: null,
        expiresAt: null,
        ...(attempts === undefined ? {} : { attempts }),
        updatedAt: new Date(),
      })
      .where(eq(contactVerificationChannels.id, id));
  }

  async function sendCode(
    user: ContactVerificationUser,
    channel: ContactVerificationChannel,
  ): Promise<{ expiresAt: string; devCode: string | null }> {
    const target = targetFor(user, channel);
    if (!target) {
      throw new ORPCError("CONFLICT", {
        message:
          channel === "email"
            ? "Cadastre um e-mail antes de verificar."
            : "Cadastre um telefone antes de verificar.",
      });
    }
    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);
    const code = generateCode();
    const values = {
      target,
      codeHash: hashCode(user.id, channel, code),
      codeSentAt: now,
      expiresAt,
      attempts: 0,
      verifiedAt: null,
      updatedAt: now,
    };
    await db
      .insert(contactVerificationChannels)
      .values({ id: newId(), userId: user.id, channel, ...values })
      .onConflictDoUpdate({
        target: [contactVerificationChannels.userId, contactVerificationChannels.channel],
        set: values,
      });
    await notifier.sendCode(channel, target, code);
    logger.info({ userId: user.id, channel }, "código de verificação gerado");
    return {
      expiresAt: expiresAt.toISOString(),
      devCode: config.VERIFICATION_DEV_CODES ? code : null,
    };
  }

  return {
    async getState(user: ContactVerificationUser): Promise<ContactVerificationState> {
      const now = new Date();
      const rows = await db
        .select()
        .from(contactVerificationChannels)
        .where(eq(contactVerificationChannels.userId, user.id));
      const byChannel = new Map(rows.map((row) => [row.channel, row]));
      return {
        email: toPublicChannelState(byChannel.get("email") ?? null, targetFor(user, "email"), now),
        phone: toPublicChannelState(byChannel.get("phone") ?? null, targetFor(user, "phone"), now),
        required: config.VERIFICATION_REQUIRED,
      };
    },

    sendCode,

    async changePhone(
      user: ContactVerificationUser,
      phone: string,
    ): Promise<{ expiresAt: string; devCode: string | null }> {
      const nextPhone = phone.trim();
      const phoneError = validatePhone(nextPhone);
      if (phoneError) {
        throw new ORPCError("BAD_REQUEST", { message: phoneError });
      }
      const now = new Date();
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({ phone: nextPhone, phoneVerified: false, updatedAt: now })
          .where(eq(users.id, user.id));
        await tx
          .delete(contactVerificationChannels)
          .where(
            and(
              eq(contactVerificationChannels.userId, user.id),
              eq(contactVerificationChannels.channel, "phone"),
            ),
          );
      });
      logger.info({ userId: user.id }, "telefone alterado");
      return sendCode({ ...user, phone: nextPhone }, "phone");
    },

    async confirmCode(
      user: ContactVerificationUser,
      channel: ContactVerificationChannel,
      code: string,
    ): Promise<{ success: boolean; message: string }> {
      const now = new Date();
      const target = targetFor(user, channel);
      const row = await findRow(user.id, channel);
      const targetMatches = row ? normalizeTarget(row.target) === normalizeTarget(target) : false;
      const alive = Boolean(
        row &&
        targetMatches &&
        row.codeHash &&
        row.expiresAt &&
        row.expiresAt.getTime() > now.getTime(),
      );
      if (!row || !alive) {
        if (row) {
          await clearCode(row.id);
        }
        return { success: false, message: EXPIRED_MESSAGE };
      }
      if (row.codeHash !== hashCode(user.id, channel, code)) {
        const attempts = row.attempts + 1;
        if (attempts >= VERIFICATION_MAX_ATTEMPTS) {
          await clearCode(row.id, attempts);
        } else {
          await db
            .update(contactVerificationChannels)
            .set({ attempts, updatedAt: now })
            .where(eq(contactVerificationChannels.id, row.id));
        }
        return { success: false, message: INVALID_MESSAGE };
      }
      await db.transaction(async (tx) => {
        await tx
          .update(contactVerificationChannels)
          .set({
            verifiedAt: now,
            codeHash: null,
            codeSentAt: null,
            expiresAt: null,
            updatedAt: now,
          })
          .where(eq(contactVerificationChannels.id, row.id));
        await tx
          .update(users)
          .set(
            channel === "email"
              ? { emailVerified: true, updatedAt: now }
              : { phoneVerified: true, updatedAt: now },
          )
          .where(eq(users.id, user.id));
      });
      logger.info({ userId: user.id, channel }, "canal verificado");
      return {
        success: true,
        message:
          channel === "email" ? "E-mail validado com sucesso." : "Telefone validado com sucesso.",
      };
    },
  };
}
