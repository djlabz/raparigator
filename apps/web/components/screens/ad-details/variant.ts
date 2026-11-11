import type { ProfessionalAd } from "@/lib/types";

export type AdDetailsVariant = "premium" | "standard";

export function getAdDetailsVariant(ad: Pick<ProfessionalAd, "adTier">): AdDetailsVariant {
  return ad.adTier === "premium" ? "premium" : "standard";
}
