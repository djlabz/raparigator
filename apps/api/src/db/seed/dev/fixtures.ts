import type {
  AdminActivityLog,
  ClientAccount,
  MediaHighlight,
  ProfessionalAd,
  Report,
  Review,
} from "@sigillus/contracts";
import devData from "../fixtures/dev-data.json" with { type: "json" };

export type SeedAd = Omit<ProfessionalAd, "images" | "profileImage" | "profileImageIndex"> & {
  displayName: string;
  imageCount: number;
};

export type SeedMediaHighlight = Omit<MediaHighlight, "coverUrl"> & {
  coverAdSlug: string;
  coverImageIndex: number;
};

type DevData = {
  ads: SeedAd[];
  reviews: Review[];
  mediaHighlights: SeedMediaHighlight[];
  seedClients: ClientAccount[];
  seedReports: Report[];
  adminActivityLog: AdminActivityLog[];
};

export const fixtures = devData as unknown as DevData;
