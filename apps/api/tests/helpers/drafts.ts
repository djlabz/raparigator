import type { AnnouncementDraftState } from "@sigillus/contracts";
import { buildInitialState } from "@sigillus/domain";

export function emptyDraft(): AnnouncementDraftState {
  return buildInitialState({
    slug: "x",
    artisticName: "X",
    city: "",
    state: "",
    startingPrice: 0,
    images: [],
    rating: 0,
    reviewsCount: 0,
    profileViews: 0,
    status: "livre",
  });
}

export function completeDraft(): AnnouncementDraftState {
  const draft = emptyDraft();
  return {
    ...draft,
    shortDescription: "Curta e direta",
    description: "Descrição longa o bastante para o anúncio.",
    characteristics: {
      ...draft.characteristics,
      gender: "Mulher",
      ethnicity: "Morena",
      height: "170",
      weight: "60",
      hairColor: "Liso::Castanho",
      smoker: "Não",
    },
    services: draft.services.map((item, index) => ({ ...item, selected: index < 2 })),
    pricing: [
      { label: "1 hora", price: "35000", disabled: false, billingType: "hourly" },
      { label: "30 min", price: "20000", disabled: false, billingType: "hourly" },
    ],
    paymentMethods: ["pix"],
    locationState: "SP",
    locationCity: "Sao Paulo",
    locationAddresses: [
      {
        id: "addr-1",
        label: "Jardins",
        addressLine: "Jardins",
        city: "Sao Paulo",
        state: "SP",
        country: "Brasil",
        notes: "",
        active: true,
      },
    ],
  };
}
