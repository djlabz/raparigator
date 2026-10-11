import { authed, professional } from "../../orpc/base";
import { recordAccess } from "../access-log";

export const mediaRouter = {
  createUpload: authed.media.createUpload.handler(({ context, input }) =>
    context.deps.services.media.createUpload(context.user.id, input),
  ),
  completeUpload: authed.media.completeUpload.handler(async ({ context, input }) => {
    const asset = await context.deps.services.media.completeUpload(context.user.id, input.assetId);
    await recordAccess(context.deps.jobs, {
      userId: context.user.id,
      event: "media_upload",
      headers: context.request.headers,
    });
    return asset;
  }),
  get: authed.media.get.handler(({ context, input }) =>
    context.deps.services.media.get(context.user.id, input.assetId),
  ),
  listMine: authed.media.listMine.handler(({ context, input }) =>
    context.deps.services.media.listMine(context.user.id, input.purpose),
  ),
  remove: authed.media.remove.handler(({ context, input }) =>
    context.deps.services.media.remove(context.user.id, input.assetId),
  ),
  reorder: professional.media.reorder.handler(({ context, input }) =>
    context.deps.services.media.reorder(context.user.id, input.assetIds),
  ),
  setProfileImage: professional.media.setProfileImage.handler(({ context, input }) =>
    context.deps.services.media.setProfileImage(context.user.id, input.assetId),
  ),
};
