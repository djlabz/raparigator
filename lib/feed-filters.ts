import type { ProfessionalAd } from "@/lib/types";
import type {
  FeedAdTypeLabel,
  FeedFiltersCriteria,
  FeedQuickFilterLabel,
  FeedSelectionField,
} from "@/lib/feed-filters-types";

export const FEED_QUICK_FILTER_LABELS: FeedQuickFilterLabel[] = ["Premium", "Livre Agora", "Com local"];
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

export function normalizeFeedText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

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

export function isFeedNormalSelected(criteria: FeedFiltersCriteria): boolean {
  return criteria.adTiers.includes("normal");
}

export function filterAds(
  ads: ProfessionalAd[],
  criteria: FeedFiltersCriteria,
): ProfessionalAd[] {
  return ads.filter((ad) => {
    const cityMatch = criteria.selectedCity === "all" || ad.city === criteria.selectedCity;
    const priceMatch = ad.startingPrice <= criteria.maxPrice;
    const selectedCategory = FEED_CATEGORY_BY_GENDER[criteria.selectedGender];
    const categoryMatch =
      criteria.selectedGender === FEED_DEFAULT_GENDER || ad.category === selectedCategory;

    const adTypeMatch =
      criteria.adTiers.length === 0 || criteria.adTiers.includes(ad.adTier);

    const quickStatusMatch =
      !criteria.quickFilters.includes("Livre Agora") || ad.status === "livre";
    const quickLocalMatch =
      !criteria.quickFilters.includes("Com local") ||
      ad.services.some((service) => {
        const normalizedService = normalizeFeedText(service);
        return normalizedService.includes("hotel") || normalizedService.includes("local");
      });

    const ethnicityMatch =
      criteria.ethnicities.length === 0 ||
      criteria.ethnicities.some((ethnicity) => {
        const normalizedEthnicity = normalizeFeedText(ethnicity);
        const adEthnicity = normalizeFeedText(ad.ethnicity);
        if (normalizedEthnicity === "caucasiana") {
          return adEthnicity.includes("branca") || adEthnicity.includes("cauc");
        }
        if (normalizedEthnicity === "negra") {
          return adEthnicity.includes("negra") || adEthnicity.includes("preta");
        }
        if (normalizedEthnicity === "asiatica") {
          return adEthnicity.includes("asiat");
        }
        if (normalizedEthnicity === "latina") {
          return adEthnicity.includes("latin") || adEthnicity.includes("parda");
        }
        return adEthnicity.includes(normalizedEthnicity);
      });

    const hairMatch =
      criteria.hairs.length === 0 ||
      criteria.hairs.some((hair) => {
        const normalizedHair = normalizeFeedText(hair);
        const adHair = normalizeFeedText(ad.hairColor);
        if (normalizedHair === "loira") {
          return adHair.includes("loiro") || adHair.includes("loira");
        }
        if (normalizedHair === "morena") {
          return (
            adHair.includes("castanho") || adHair.includes("moreno") || adHair.includes("preto")
          );
        }
        if (normalizedHair === "ruiva") {
          return adHair.includes("ruiv");
        }
        return adHair.includes(normalizedHair);
      });

    const serviceMatch =
      criteria.services.length === 0 ||
      criteria.services.some((service) => {
        const normalizedSelection = normalizeFeedText(service);
        return ad.services.some((adService) => {
          const normalizedService = normalizeFeedText(adService);
          if (normalizedSelection.includes("jantares")) {
            return normalizedService.includes("jantar") || normalizedService.includes("evento");
          }
          if (normalizedSelection.includes("viagem")) {
            return normalizedService.includes("viagem") || normalizedService.includes("tour");
          }
          return normalizedService.includes(normalizedSelection);
        });
      });

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
  });
}

export function partitionFeedAds(ads: ProfessionalAd[]): {
  premium: ProfessionalAd[];
  standard: ProfessionalAd[];
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
