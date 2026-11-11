import type { ProfessionalAd } from "@sigillus/contracts";

export const EMPTY_PROFESSIONAL_AD_ID = "meu-perfil";

export function emptyProfessionalAd(): ProfessionalAd {
  return {
    id: EMPTY_PROFESSIONAL_AD_ID,
    slug: EMPTY_PROFESSIONAL_AD_ID,
    artisticName: "",
    city: "",
    state: "",
    neighborhood: "",
    category: "",
    shortDescription: "",
    description: "",
    serviceDescription: "",
    startingPrice: 0,
    age: 0,
    heightCm: 0,
    weightKg: 0,
    ethnicity: "",
    eyeColor: "",
    hairType: "",
    hairColor: "",
    services: [],
    serviceOptions: [],
    fetishOptions: [],
    fetishCustom: "",
    pricingTable: [],
    paymentMethods: [],
    status: "livre",
    adTier: "normal",
    verificationStatus: "draft",
    images: [],
    rating: 0,
    reviewsCount: 0,
    profileViews: 0,
  };
}
