import { RATE_LIMITS } from "../../lib/rate-limit";
import { authed, rateLimited } from "../../orpc/base";

export const contactVerificationRouter = {
  getState: authed.contactVerification.getState.handler(({ context }) =>
    context.deps.services.contactVerification.getState(context.user),
  ),
  sendCode: authed.contactVerification.sendCode
    .use(rateLimited("contactVerification.send", RATE_LIMITS.contactVerificationSend))
    .handler(({ context, input }) =>
      context.deps.services.contactVerification.sendCode(context.user, input.channel),
    ),
  confirmCode: authed.contactVerification.confirmCode
    .use(rateLimited("contactVerification.confirm", RATE_LIMITS.contactVerificationConfirm))
    .handler(({ context, input }) =>
      context.deps.services.contactVerification.confirmCode(
        context.user,
        input.channel,
        input.code,
      ),
    ),
  changePhone: authed.contactVerification.changePhone
    .use(rateLimited("contactVerification.send", RATE_LIMITS.contactVerificationSend))
    .handler(({ context, input }) =>
      context.deps.services.contactVerification.changePhone(context.user, input.phone),
    ),
};
