import { ORPCError } from "@orpc/server";
import { verifyPassword } from "better-auth/crypto";
import type { User } from "@sigillus/contracts";
import { INVALID_CPF_MESSAGE, isValidCpf } from "@sigillus/domain";
import type { Database, DbExecutor } from "../../db/client";
import type { JobQueue } from "../../lib/jobs";
import type { Logger } from "../../lib/logger";
import { createAuthRepository, type AuthRepository } from "./repository";
import type { UserSession } from "./user-auth";

export const STORAGE_PURGE_JOB = "storage.purge";

const WRONG_PASSWORD_MESSAGE = "Senha incorreta.";
const NO_PASSWORD_MESSAGE = "Esta conta não tem senha cadastrada.";

export type AuthServiceDeps = {
  db: Database;
  jobs: JobQueue;
  logger: Logger;
  uploadTtlSeconds: number;
  repository?: AuthRepository;
  chat: { anonymizeUserMessages: (userId: string, executor: DbExecutor) => Promise<void> };
  identity: {
    fileKeysForUser: (userId: string, executor: DbExecutor) => Promise<string[]>;
    scheduleFileDeletion: (userId: string, keys: string[]) => Promise<void>;
  };
};

export type AuthService = ReturnType<typeof createAuthService>;

function profileChanges(input: { cpf?: string; city?: string }) {
  const changes: { cpf?: string; city?: string } = {};
  if (input.cpf !== undefined) {
    const cpf = input.cpf.trim();
    if (!isValidCpf(cpf)) {
      throw new ORPCError("BAD_REQUEST", { message: INVALID_CPF_MESSAGE });
    }
    changes.cpf = cpf;
  }
  if (input.city !== undefined) {
    const city = input.city.trim();
    if (!city) {
      throw new ORPCError("BAD_REQUEST", { message: "Informe sua cidade." });
    }
    changes.city = city;
  }
  return changes;
}

export function createAuthService(deps: AuthServiceDeps) {
  const { db, jobs, logger, chat, identity, uploadTtlSeconds } = deps;
  const repository = deps.repository ?? createAuthRepository(db);

  async function assertPassword(userId: string, password: string) {
    const hash = await repository.findCredentialPasswordHash(userId);
    if (!hash) {
      throw new ORPCError("BAD_REQUEST", { message: NO_PASSWORD_MESSAGE });
    }
    if (!(await verifyPassword({ hash, password }))) {
      throw new ORPCError("BAD_REQUEST", { message: WRONG_PASSWORD_MESSAGE });
    }
  }

  return {
    async me(session: UserSession | null): Promise<User | null> {
      if (!session) {
        return null;
      }
      const raw = session.user as Record<string, unknown>;
      const role = (raw.role as User["role"] | undefined) ?? "cliente";
      const user: User = {
        id: session.user.id,
        role,
        fullName: session.user.name,
        email: session.user.email,
        phone: (raw.phone as string | undefined) ?? undefined,
        cpf: (raw.cpf as string | undefined) ?? undefined,
        alias: (raw.alias as string | undefined) ?? undefined,
        city: (raw.city as string | undefined) ?? undefined,
      };
      if (role === "profissional") {
        const tier = await repository.findProfileTier(session.user.id);
        user.plan = tier === "premium" ? "premium" : "standard";
      }
      return user;
    },

    async updateProfile(userId: string, input: { cpf?: string; city?: string }) {
      const changes = profileChanges(input);
      if (Object.keys(changes).length > 0) {
        await repository.updateUser(userId, changes);
      }
      return { ok: true as const };
    },

    async deleteAccount(input: { userId: string; password: string }) {
      const { userId } = input;
      await assertPassword(userId, input.password);

      const { mediaKeys, identityKeys } = await db.transaction(async (tx) => {
        await repository.lockUser(tx, userId);
        const mediaKeys = await repository.listMediaStorageKeys(userId, tx);
        const identityKeys = await identity.fileKeysForUser(userId, tx);
        await chat.anonymizeUserMessages(userId, tx);
        await repository.deleteUser(tx, userId);
        return { mediaKeys, identityKeys };
      });

      const pending = [
        {
          job: "identity.delete-files",
          keys: identityKeys,
          run: () => identity.scheduleFileDeletion(userId, identityKeys),
        },
        {
          job: STORAGE_PURGE_JOB,
          keys: mediaKeys,
          run: () =>
            jobs.enqueue(
              STORAGE_PURGE_JOB,
              { keys: mediaKeys },
              { startAfter: new Date(Date.now() + uploadTtlSeconds * 1000) },
            ),
        },
      ].filter((cleanup) => cleanup.keys.length > 0);
      const results = await Promise.allSettled(pending.map((cleanup) => cleanup.run()));
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const cleanup = pending[index]!;
          logger.error(
            { err: result.reason, userId, job: cleanup.job, keys: cleanup.keys },
            "conta excluída sem job de limpeza enfileirado; apagar as chaves manualmente",
          );
        }
      });
      logger.info(
        { userId, mediaObjects: mediaKeys.length, identityFiles: identityKeys.length },
        "conta excluída",
      );
      return { ok: true as const };
    },
  };
}
