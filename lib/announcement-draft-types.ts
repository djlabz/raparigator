export type AvailabilityDay = {
  day: string;
  enabled: boolean;
  start: string;
  end: string;
};

export type AnnouncementAdPreview = {
  slug: string;
  displayName: string;
  artisticName: string;
  city: string;
  state: string;
  startingPrice: number;
  images: string[];
  profileImage?: string;
  profileImageIndex?: number;
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

export type AnnouncementServiceOption = {
  label: string;
  selected: boolean;
};

export type AnnouncementPricingItem = {
  label: string;
  price: string;
  disabled: boolean;
  billingType?: "hourly" | "fixed";
};

export type AnnouncementLocationVenue = {
  key: string;
  label: string;
  checked: boolean;
};

export type AnnouncementLocationAddress = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  active: boolean;
};

export type AnnouncementCharacteristics = {
  gender: string;
  genitalia: string;
  sexualPreference: string;
  weight: string;
  height: string;
  ethnicity: string;
  eyeColor: string;
  hairColor: string;
  hairLength: string;
  silicone: string;
  tattoos: string;
  piercings: string;
  smoker: string;
  languages: string;
};

export type AnnouncementDraftState = {
  images: string[];
  coverIndex: number;
  coverPreviews: string[];
  profileIndex: number | null;
  profilePreviews: string[];
  shortDescription: string;
  description: string;
  characteristics: AnnouncementCharacteristics;
  services: AnnouncementServiceOption[];
  pricing: AnnouncementPricingItem[];
  paymentMethods: string[];
  venues: AnnouncementLocationVenue[];
  acceptsTravel: boolean;
  locationAddresses: AnnouncementLocationAddress[];
  locationState: string;
  locationCity: string;
  showAvailability: boolean;
  availability: AvailabilityDay[];
};

export type AnnouncementSaveStatus = "idle" | "saving" | "saved" | "error";

export type AnnouncementSmartTip = {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
};

export type AnnouncementProfileScore = {
  percentage: number;
  breakdown: {
    photos: number;
    description: number;
    pricing: number;
    services: number;
    location: number;
  };
};

export type AnnouncementSectionKey =
  | "characteristics"
  | "pricing"
  | "location"
  | "description"
  | "services"
  | "availability";

export type AnnouncementSectionSnapshots = Record<AnnouncementSectionKey, string>;

export type AnnouncementSectionDirtyState = Record<AnnouncementSectionKey, boolean>;

export type AnnouncementSaveResult = "saved" | "no_changes" | "error" | "busy";

export type AnnouncementPublishWarningItem = {
  kind: "required" | "unsaved";
  section: AnnouncementSectionKey;
  label: string;
};

export type AnnouncementSaveSectionFailure =
  | {
      ok: false;
      reason: "characteristics";
      missing: Array<keyof Pick<AnnouncementCharacteristics, "gender" | "ethnicity" | "height" | "weight" | "hairColor" | "smoker">>;
      message: string;
    }
  | {
      ok: false;
      reason: "pricing";
      message: string;
    }
  | {
      ok: false;
      reason: "busy" | "error" | "not_dirty";
    };

export type AnnouncementSaveSectionSuccess = {
  ok: true;
  saveResult: AnnouncementSaveResult;
};

export type AnnouncementSaveSectionResult = AnnouncementSaveSectionSuccess | AnnouncementSaveSectionFailure;

export type AnnouncementPublishResult =
  | { ok: true }
  | {
      ok: false;
      reason: "blocked";
      message: string;
      items: AnnouncementPublishWarningItem[];
    }
  | {
      ok: false;
      reason: "error";
      message: string;
    };
