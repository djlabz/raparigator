import { and, eq } from "drizzle-orm";
import type { Database, DbExecutor } from "../../db/client";
import { accounts, mediaAssets, professionalProfiles, users } from "../../db/schema";

const CREDENTIAL_PROVIDER = "credential";

export type AuthRepository = ReturnType<typeof createAuthRepository>;

export function createAuthRepository(db: Database) {
  return {
    async findCredentialPasswordHash(userId: string): Promise<string | null> {
      const [row] = await db
        .select({ password: accounts.password })
        .from(accounts)
        .where(and(eq(accounts.userId, userId), eq(accounts.providerId, CREDENTIAL_PROVIDER)))
        .limit(1);
      return row?.password ?? null;
    },

    async findProfileTier(userId: string): Promise<"premium" | "normal" | null> {
      const [row] = await db
        .select({ adTier: professionalProfiles.adTier })
        .from(professionalProfiles)
        .where(eq(professionalProfiles.userId, userId))
        .limit(1);
      return row?.adTier ?? null;
    },

    async updateUser(userId: string, changes: { cpf?: string; city?: string }): Promise<void> {
      await db
        .update(users)
        .set({ ...changes, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },

    async lockUser(executor: DbExecutor, userId: string): Promise<void> {
      await executor.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    },

    async listMediaStorageKeys(userId: string, executor: DbExecutor = db): Promise<string[]> {
      const rows = await executor
        .select({ storageKey: mediaAssets.storageKey, thumbnailKey: mediaAssets.thumbnailKey })
        .from(mediaAssets)
        .where(eq(mediaAssets.ownerUserId, userId));
      return rows.flatMap((row) =>
        row.thumbnailKey ? [row.storageKey, row.thumbnailKey] : [row.storageKey],
      );
    },

    async deleteUser(executor: DbExecutor, userId: string): Promise<void> {
      await executor.delete(users).where(eq(users.id, userId));
    },
  };
}
