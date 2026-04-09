export type AvailabilityDay = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type HistoryItem = {
  id: number;
  client: string;
  service: string;
  date: string;
  status: "Concluído" | "Finalizado" | "Em Andamento";
  value: string;
};

export type HistoryFilter = "Todos" | "Concluído" | "Finalizado" | "Em Andamento";

export type AdStatus = "Ativo" | "Pausado";

export type AdPreview = {
  slug: string;
  displayName: string;
  artisticName: string;
  city: string;
  state: string;
  startingPrice: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  profileViews: number;
  status: string;
  shortDescription?: string;
  description?: string;
  services?: string[];
  pricingTable?: Array<{ label: string; price: number }>;
  neighborhood?: string;
  category?: string;
  heightCm?: number;
  ethnicity?: string;
  hairColor?: string;
};

// ─── Profile Form Types ───────────────────────────────────────────

export type ServiceOption = {
  label: string;
  selected: boolean;
};

export type PricingItem = {
  label: string;
  price: string;
  disabled: boolean;
};

export type LocationVenue = {
  key: string;
  label: string;
  checked: boolean;
};

export type ProfileCharacteristics = {
  // Grupo Básico
  gender: string;
  genitalia: string;
  sexualPreference: string;
  // Grupo Corpo
  weight: string;
  height: string;
  ethnicity: string;
  eyeColor: string;
  hairColor: string;
  hairLength: string;
  // Grupo Extras
  silicone: string;
  tattoos: string;
  piercings: string;
  smoker: string;
  // Grupo Outros
  languages: string;
};

export type ProfileFormState = {
  // Fotos
  images: string[];
  coverIndex: number;
  // Descrição
  shortDescription: string;
  description: string;
  // Características
  characteristics: ProfileCharacteristics;
  // Serviços
  services: ServiceOption[];
  // Preços
  pricing: PricingItem[];
  // Localização
  venues: LocationVenue[];
  locationState: string;
  locationCity: string;
  // Disponibilidade
  showAvailability: boolean;
  availability: AvailabilityDay[];
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type SmartTip = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type ProfileScore = {
  percentage: number;
  breakdown: {
    photos: number;
    description: number;
    pricing: number;
    services: number;
    location: number;
  };
};

export type ReviewItem = {
  id: string;
  author: string;
  timeAgo: string;
  text: string;
  score: number;
};
