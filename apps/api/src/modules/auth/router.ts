import { ORPCError } from "@orpc/server";
import { authed, os, withAccessLog } from "../../orpc/base";
import { getUserSession } from "../../orpc/context";

export const authRouter = {
  me: os.auth.me.handler(async ({ context }) => ({
    user: await context.deps.services.auth.me(await getUserSession(context)),
  })),
  deleteAccount: os.auth.deleteAccount
    .use(withAccessLog("account_delete"))
    .handler(async ({ context, input }) => {
      const session = await getUserSession(context);
      if (!session) {
        throw new ORPCError("UNAUTHORIZED", { message: "Não autenticado." });
      }
      return context.deps.services.auth.deleteAccount({
        userId: session.user.id,
        password: input.password,
      });
    }),
  updateProfile: authed.auth.updateProfile.handler(({ context, input }) =>
    context.deps.services.auth.updateProfile(context.user.id, input),
  ),
};
