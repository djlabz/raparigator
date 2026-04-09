export type AvailabilityStatus = "livre" | "em_atendimento" | "indisponivel";

export type AdCategory = "premium" | "normal";

export type AuthRole = "visitor" | "cliente" | "profissional";

export interface MockUser {
  id: string;
  role: Exclude<AuthRole, "visitor">;
  fullName: string;
  email: string;
  password: string;
  label: string;
}

export interface ProfessionalAd {
  id: string;
  slug: string;
  displayName: string;
  artisticName: string;
  city: string;
  state: string;
  neighborhood: string;
  category: string;
  shortDescription: string;
  description: string;
  serviceDescription: string;
  startingPrice: number;
  heightCm: number;
  ethnicity: string;
  hairColor: string;
  services: string[];
  serviceOptions: string[];
  fetishOptions: string[];
  fetishCustom: string;
  pricingTable: Array<{ label: string; price: number }>;
  status: AvailabilityStatus;
  adTier: AdCategory;
  images: string[];
  rating: number;
  reviewsCount: number;
  profileViews: number;
}

export interface Review {
  id: string;
  adId: string;
  author: string;
  score: number;
  comment: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactStatus: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  from: "me" | "other";
  content: string;
  sentAt: string;
}

export interface MediaHighlight {
  id: string;
  category: string;
  professionalName: string;
  coverUrl: string;
  likes: number;
  views: number;
  kind: "foto" | "video";
}
