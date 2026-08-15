import type {
  FeedAdTypeLabel,
  FeedFiltersCriteria,
  FeedQuickFilterLabel,
  FeedSelectionField,
  ProfessionalAd,
} from "@sigillus/contracts";
import { normalizeText } from "./format";

export type FeedFilterableAd = Pick<
  ProfessionalAd,
  | "city"
  | "startingPrice"
  | "category"
  | "adTier"
  | "status"
  | "services"
  | "ethnicity"
  | "hairColor"
>;

export const FEED_QUICK_FILTER_LABELS: FeedQuickFilterLabel[] = [
  "Premium",
  "Livre Agora",
  "Com local",
];
export const FEED_DEFAULT_LOCATION_LABEL = "São Paulo, SP";
export const FEED_DEFAULT_GENDER = "Todas";
export const FEED_DEFAULT_MAX_PRICE = 1500;
export const FEED_CATEGORY_BY_GENDER: Record<string, string> = {
  Todas: "",
  Mulher: "Feminino",
  Homem: "Masculino",
  Trans: "Trans",
  Casal: "Casais",
};

export const normalizeFeedText = normalizeText;

function toggleInArray<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export function createFeedFiltersCriteria(
  partial: Partial<FeedFiltersCriteria> = {},
): FeedFiltersCriteria {
  return {
    selectedCity: partial.selectedCity ?? "all",
    selectedGender: partial.selectedGender ?? FEED_DEFAULT_GENDER,
    maxPrice: partial.maxPrice ?? FEED_DEFAULT_MAX_PRICE,
    adTiers: partial.adTiers ? [...partial.adTiers] : [],
    quickFilters: partial.quickFilters ? [...partial.quickFilters] : [],
    ethnicities: partial.ethnicities ? [...partial.ethnicities] : [],
    hairs: partial.hairs ? [...partial.hairs] : [],
    services: partial.services ? [...partial.services] : [],
  };
}

export function clearFeedFilters(): FeedFiltersCriteria {
  return createFeedFiltersCriteria();
}

export function toggleFeedQuickFilter(
  criteria: FeedFiltersCriteria,
  label: FeedQuickFilterLabel,
): FeedFiltersCriteria {
  if (label === "Premium") {
    return {
      ...criteria,
      adTiers: toggleInArray(criteria.adTiers, "premium"),
    };
  }

  return {
    ...criteria,
    quickFilters: toggleInArray(criteria.quickFilters, label),
  };
}

export function toggleFeedAdType(
  criteria: FeedFiltersCriteria,
  label: FeedAdTypeLabel,
): FeedFiltersCriteria {
  switch (label) {
    case "Premium":
      return {
        ...criteria,
        adTiers: toggleInArray(criteria.adTiers, "premium"),
      };
    case "Comum":
      return {
        ...criteria,
        adTiers: toggleInArray(criteria.adTiers, "normal"),
      };
    default: {
      const _exhaustive: never = label;
      return _exhaustive;
    }
  }
}

export function toggleFeedSelection(
  criteria: FeedFiltersCriteria,
  field: FeedSelectionField,
  value: string,
): FeedFiltersCriteria {
  return {
    ...criteria,
    [field]: toggleInArray(criteria[field], value),
  };
}

export function withFeedGender(
  criteria: FeedFiltersCriteria,
  selectedGender: string,
): FeedFiltersCriteria {
  return { ...criteria, selectedGender };
}

export function withFeedMaxPrice(
  criteria: FeedFiltersCriteria,
  maxPrice: number,
): FeedFiltersCriteria {
  return { ...criteria, maxPrice };
}

export function withFeedCity(
  criteria: FeedFiltersCriteria,
  selectedCity: string,
): FeedFiltersCriteria {
  return { ...criteria, selectedCity };
}

export function isFeedPremiumSelected(criteria: FeedFiltersCriteria): boolean {
  return criteria.adTiers.includes("premium");
}

export function matchesFeedEthnicity(adEthnicity: string, selected: string): boolean {
  const normalizedEthnicity = normalizeText(selected);
  const normalizedAd = normalizeText(adEthnicity);
  if (normalizedEthnicity === "caucasiana") {
    return normalizedAd.includes("branca") || normalizedAd.includes("cauc");
  }
  if (normalizedEthnicity === "negra") {
    return normalizedAd.includes("negra") || normalizedAd.includes("preta");
  }
  if (normalizedEthnicity === "asiatica") {
    return normalizedAd.includes("asiat");
  }
  if (normalizedEthnicity === "latina") {
    return normalizedAd.includes("latin") || normalizedAd.includes("parda");
  }
  return normalizedAd.includes(normalizedEthnicity);
}

export function matchesFeedHair(adHairColor: string, selected: string): boolean {
  const normalizedHair = normalizeText(selected);
  const adHair = normalizeText(adHairColor);
  if (normalizedHair === "loira") {
    return adHair.includes("loiro") || adHair.includes("loira");
  }
  if (normalizedHair === "morena") {
    return adHair.includes("castanho") || adHair.includes("moreno") || adHair.includes("preto");
  }
  if (normalizedHair === "ruiva") {
    return adHair.includes("ruiv");
  }
  return adHair.includes(normalizedHair);
}

export function matchesFeedService(adServices: string[], selected: string): boolean {
  const normalizedSelection = normalizeText(selected);
  return adServices.some((adService) => {
    const normalizedService = normalizeText(adService);
    if (normalizedSelection.includes("jantares")) {
      return normalizedService.includes("jantar") || normalizedService.includes("evento");
    }
    if (normalizedSelection.includes("viagem")) {
      return normalizedService.includes("viagem") || normalizedService.includes("tour");
    }
    return normalizedService.includes(normalizedSelection);
  });
}

export function hasFeedLocalService(adServices: string[]): boolean {
  return adServices.some((service) => {
    const normalizedService = normalizeText(service);
    return normalizedService.includes("hotel") || normalizedService.includes("local");
  });
}

export function matchesFeedCriteria(ad: FeedFilterableAd, criteria: FeedFiltersCriteria): boolean {
  const cityMatch = criteria.selectedCity === "all" || ad.city === criteria.selectedCity;
  const priceMatch = ad.startingPrice <= criteria.maxPrice;
  const selectedCategory = FEED_CATEGORY_BY_GENDER[criteria.selectedGender];
  const categoryMatch =
    criteria.selectedGender === FEED_DEFAULT_GENDER || ad.category === selectedCategory;

  const adTypeMatch = criteria.adTiers.length === 0 || criteria.adTiers.includes(ad.adTier);

  const quickStatusMatch = !criteria.quickFilters.includes("Livre Agora") || ad.status === "livre";
  const quickLocalMatch =
    !criteria.quickFilters.includes("Com local") || hasFeedLocalService(ad.services);

  const ethnicityMatch =
    criteria.ethnicities.length === 0 ||
    criteria.ethnicities.some((ethnicity) => matchesFeedEthnicity(ad.ethnicity, ethnicity));

  const hairMatch =
    criteria.hairs.length === 0 ||
    criteria.hairs.some((hair) => matchesFeedHair(ad.hairColor, hair));

  const serviceMatch =
    criteria.services.length === 0 ||
    criteria.services.some((service) => matchesFeedService(ad.services, service));

  return (
    cityMatch &&
    priceMatch &&
    categoryMatch &&
    adTypeMatch &&
    quickStatusMatch &&
    quickLocalMatch &&
    ethnicityMatch &&
    hairMatch &&
    serviceMatch
  );
}

export function filterAds<T extends FeedFilterableAd>(
  ads: T[],
  criteria: FeedFiltersCriteria,
): T[] {
  return ads.filter((ad) => matchesFeedCriteria(ad, criteria));
}

export function partitionFeedAds<T extends Pick<ProfessionalAd, "adTier">>(
  ads: T[],
): {
  premium: T[];
  standard: T[];
} {
  return {
    premium: ads.filter((ad) => ad.adTier === "premium"),
    standard: ads.filter((ad) => ad.adTier === "normal"),
  };
}

export function serializeFeedFiltersCriteria(criteria: FeedFiltersCriteria): string {
  return JSON.stringify({
    selectedCity: criteria.selectedCity,
    selectedGender: criteria.selectedGender,
    maxPrice: criteria.maxPrice,
    adTiers: criteria.adTiers,
    quickFilters: criteria.quickFilters,
    ethnicities: criteria.ethnicities,
    hairs: criteria.hairs,
    services: criteria.services,
  });
}

export function feedRelevanceScore(
  ad: Pick<ProfessionalAd, "adTier" | "rating" | "profileViews">,
  visibilityMultiplier: number,
): number {
  const base = ad.rating * 100 + Math.log10(Math.max(ad.profileViews, 1)) * 10;
  return ad.adTier === "premium" ? base * visibilityMultiplier : base;
}
