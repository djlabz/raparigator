import { admin, professional } from "../../orpc/base";

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
