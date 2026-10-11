import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { isAPIError } from "better-auth/api";
import type { User } from "@sigillus/contracts";
import { mediaAssets, professionalProfiles } from "../../db/schema";
import { os } from "../../orpc/base";
import { getUserSession, type AppContext } from "../../orpc/context";

const DELETE_ACCOUNT_ERRORS: Record<string, string> = {
  INVALID_PASSWORD: "Senha incorreta.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Esta conta não tem senha cadastrada.",
};

export async function resolveSessionUser(context: AppContext): Promise<User | null> {
  const session = await getUserSession(context);
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
    const [profile] = await context.deps.db
      .select({ adTier: professionalProfiles.adTier })
      .from(professionalProfiles)
      .where(eq(professionalProfiles.userId, session.user.id))
      .limit(1);
    user.plan = profile?.adTier === "premium" ? "premium" : "standard";
  }
  return user;
}

export const authRouter = {
  me: os.auth.me.handler(async ({ context }) => ({ user: await resolveSessionUser(context) })),
  deleteAccount: os.auth.deleteAccount.handler(async ({ context, input }) => {
    const session = await getUserSession(context);
    if (!session) {
      throw new ORPCError("UNAUTHORIZED", { message: "Não autenticado." });
    }
    const userId = session.user.id;

    const userMedia = await context.deps.db
      .select({
        id: mediaAssets.id,
        storageKey: mediaAssets.storageKey,
        thumbnailKey: mediaAssets.thumbnailKey,
      })
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerUserId, userId));

    try {
      await context.deps.auth.api.deleteUser({
        body: { password: input.password },
        headers: context.request.headers,
      });
    } catch (err) {
      const message = isAPIError(err) ? DELETE_ACCOUNT_ERRORS[String(err.body?.code)] : undefined;
      if (message) {
        throw new ORPCError("BAD_REQUEST", { message });
      }
      context.deps.logger.error({ err, userId }, "Erro em deleteAccount");
      throw err;
    }

    for (const asset of userMedia) {
      try {
        await context.deps.storage.deleteObject(asset.storageKey);
        if (asset.thumbnailKey) {
          await context.deps.storage.deleteObject(asset.thumbnailKey);
        }
      } catch (err) {
        context.deps.logger.warn(
          { err, assetId: asset.id },
          "Falha ao apagar mídia do storage durante exclusão de conta",
        );
      }
    }

    return { ok: true as const };
  }),
};
