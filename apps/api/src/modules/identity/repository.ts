import { and, desc, eq, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import type { Database } from "../../db/client";
import { identityVerifications, professionalProfiles, users } from "../../db/schema";

export type IdentityVerificationRow = typeof identityVerifications.$inferSelect;
export type IdentityVerificationInsert = typeof identityVerifications.$inferInsert;
export type IdentityVerificationListRow = IdentityVerificationRow & {
  artisticName: string | null;
  profileSlug: string | null;
};

export type IdentityRepository = ReturnType<typeof createIdentityRepository>;

export function createIdentityRepository(db: Database) {
  return {
    async insert(values: IdentityVerificationInsert): Promise<IdentityVerificationRow> {
      const [row] = await db.insert(identityVerifications).values(values).returning();
      return row!;
    },

    async findById(id: string): Promise<IdentityVerificationRow | null> {
      const [row] = await db
        .select()
        .from(identityVerifications)
        .where(eq(identityVerifications.id, id))
        .limit(1);
      return row ?? null;
    },

    async latestForUser(userId: string): Promise<IdentityVerificationRow | null> {
      const [row] = await db
        .select()
        .from(identityVerifications)
        .where(eq(identityVerifications.userId, userId))
        .orderBy(desc(identityVerifications.createdAt))
        .limit(1);
      return row ?? null;
    },

    async activeForUser(userId: string): Promise<IdentityVerificationRow | null> {
      const [row] = await db
        .select()
        .from(identityVerifications)
        .where(
          and(
            eq(identityVerifications.userId, userId),
            inArray(identityVerifications.status, ["pending", "approved"]),
          ),
        )
        .limit(1);
      return row ?? null;
    },

    async list(status?: IdentityVerificationRow["status"]): Promise<IdentityVerificationListRow[]> {
      const query = db
        .select({
          row: identityVerifications,
          artisticName: professionalProfiles.artisticName,
          alias: users.alias,
          profileSlug: professionalProfiles.slug,
        })
        .from(identityVerifications)
        .innerJoin(users, eq(users.id, identityVerifications.userId))
        .leftJoin(
          professionalProfiles,
          eq(professionalProfiles.userId, identityVerifications.userId),
        )
        .orderBy(desc(identityVerifications.createdAt));
      const rows = await (status ? query.where(eq(identityVerifications.status, status)) : query);
      return rows.map(({ row, artisticName, alias, profileSlug }) => ({
        ...row,
        artisticName: artisticName || alias || null,
        profileSlug: profileSlug ?? null,
      }));
    },

    async reviewPending(
      id: string,
      values: Partial<IdentityVerificationInsert>,
    ): Promise<IdentityVerificationRow | null> {
      const [row] = await db
        .update(identityVerifications)
        .set(values)
        .where(and(eq(identityVerifications.id, id), eq(identityVerifications.status, "pending")))
        .returning();
      return row ?? null;
    },

    async markFilesDeleted(id: string, deletedAt: Date): Promise<void> {
      await db
        .update(identityVerifications)
        .set({ documentKey: null, selfieKey: null, filesDeletedAt: deletedAt })
        .where(eq(identityVerifications.id, id));
    },

    async listExpiredApproved(reviewedBefore: Date): Promise<IdentityVerificationRow[]> {
      return db
        .select()
        .from(identityVerifications)
        .where(
          and(
            eq(identityVerifications.status, "approved"),
            lte(identityVerifications.reviewedAt, reviewedBefore),
            isNull(identityVerifications.filesDeletedAt),
            or(
              isNotNull(identityVerifications.documentKey),
              isNotNull(identityVerifications.selfieKey),
            ),
          ),
        );
    },

    async fileKeysForUser(userId: string): Promise<string[]> {
      const rows = await db
        .select({
          documentKey: identityVerifications.documentKey,
          selfieKey: identityVerifications.selfieKey,
        })
        .from(identityVerifications)
        .where(eq(identityVerifications.userId, userId));
      return rows.flatMap((row) =>
        [row.documentKey, row.selfieKey].filter((key): key is string => Boolean(key)),
      );
    },

    async claimUnnotified(claimedAt: Date): Promise<IdentityVerificationRow[]> {
      return db
        .update(identityVerifications)
        .set({ adminNotifiedAt: claimedAt })
        .where(isNull(identityVerifications.adminNotifiedAt))
        .returning();
    },

    async releaseClaim(ids: string[], claimedAt: Date): Promise<void> {
      if (ids.length === 0) {
        return;
      }
      await db
        .update(identityVerifications)
        .set({ adminNotifiedAt: null })
        .where(
          and(
            inArray(identityVerifications.id, ids),
            eq(identityVerifications.adminNotifiedAt, claimedAt),
          ),
        );
    },
  };
}
