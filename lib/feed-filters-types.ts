import type { AdCategory } from "@/lib/types";

export type FeedQuickFilterLabel = "Premium" | "Livre Agora" | "Com local";
export type FeedAdTypeLabel = "Premium" | "Comum";
export type FeedSelectionField = "ethnicities" | "hairs" | "services";

export type FeedFiltersCriteria = {
  selectedCity: string;
  selectedGender: string;
  maxPrice: number;
  adTiers: AdCategory[];
  quickFilters: Array<"Livre Agora" | "Com local">;
  ethnicities: string[];
  hairs: string[];
  services: string[];
};
