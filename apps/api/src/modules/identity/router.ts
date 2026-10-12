import { ORPCError } from "@orpc/server";
import { getAdminSession, getUserSession } from "../../orpc/context";
import { os, professional } from "../../orpc/base";

const identityAdmin = os.middleware(async ({ context, next }) => {
  const session = await getAdminSession(context);
  if (!session) {
    const userSession = await getUserSession(context);
    if (userSession) {
      throw new ORPCError("FORBIDDEN", { message: "Acesso restrito à administração." });
    }
    throw new ORPCError("UNAUTHORIZED", { message: "Sessão de administrador necessária." });
  }
  return next({
    context: {
      admin: { id: session.user.id, name: session.user.name, email: session.user.email },
    },
  });
});

const admin = os.use(identityAdmin);

export const identityRouter = {
  getMine: professional.identity.getMine.handler(({ context }) =>
    context.deps.services.identity.getMine(context.user.id),
  ),
  createUpload: professional.identity.createUpload.handler(({ context, input }) =>
    context.deps.services.identity.createUpload(context.user.id, input),
  ),
  submit: professional.identity.submit.handler(({ context, input }) =>
    context.deps.services.identity.submit(context.user.id, input),
  ),
};

export const identityAdminRouter = {
  identityVerifications: admin.admin.identityVerifications.handler(({ context, input }) =>
    context.deps.services.identity.list(input.status),
  ),
  identityFileUrl: admin.admin.identityFileUrl.handler(({ context, input }) =>
    context.deps.services.identity.fileUrls(input.id),
  ),
  approveIdentity: admin.admin.approveIdentity.handler(({ context, input }) =>
    context.deps.services.identity.approve(input.id, context.admin),
  ),
  rejectIdentity: admin.admin.rejectIdentity.handler(({ context, input }) =>
    context.deps.services.identity.reject(input.id, input.reason, context.admin),
  ),
};
