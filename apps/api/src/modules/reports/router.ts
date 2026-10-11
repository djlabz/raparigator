import { os, rateLimited } from "../../orpc/base";
import { PUBLIC_REPORT_RATE_LIMIT } from "./service";

export const reportsRouter = {
  createPublic: os.reports.createPublic
    .use(rateLimited("reports.createPublic", PUBLIC_REPORT_RATE_LIMIT))
    .handler(({ context, input }) => context.deps.services.reports.createPublic(input)),
};
