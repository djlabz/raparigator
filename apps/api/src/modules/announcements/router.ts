import { professional } from "../../orpc/base";
import { recordAccess } from "../access-log";

export const announcementsRouter = {
  getMine: professional.announcements.getMine.handler(({ context }) =>
    context.deps.services.announcements.getMine(context.user),
  ),
  saveDraft: professional.announcements.saveDraft.handler(({ context, input }) =>
    context.deps.services.announcements.saveDraft(context.user, input.draft),
  ),
  saveSection: professional.announcements.saveSection.handler(({ context, input }) =>
    context.deps.services.announcements.saveSection(context.user, input.section, input.draft),
  ),
  publish: professional.announcements.publish.handler(async ({ context, input }) => {
    const result = await context.deps.services.announcements.publish(context.user, input.draft);
    if (result.ok) {
      await recordAccess(context.deps.jobs, {
        userId: context.user.id,
        event: "profile_publish",
        headers: context.request.headers,
      });
    }
    return result;
  }),
  setListingStatus: professional.announcements.setListingStatus.handler(({ context, input }) =>
    context.deps.services.announcements.setListingStatus(context.user, input.status),
  ),
  setAvailability: professional.announcements.setAvailability.handler(({ context, input }) =>
    context.deps.services.announcements.setAvailability(context.user, input.status),
  ),
  setContact: professional.announcements.setContact.handler(({ context, input }) =>
    context.deps.services.announcements.setContact(context.user, input),
  ),
};
