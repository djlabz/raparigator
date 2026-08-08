export type AvailabilityStatus = "livre" | "em_atendimento" | "indisponivel";

export type AdCategory = "premium" | "normal";

export type PlanTier = "standard" | "premium";

export type PremiumBillingCycle = "monthly" | "semiannual";

export type AuthRole = "visitor" | "cliente" | "profissional";

/** Status de moderação do perfil profissional */
export type VerificationStatus = "pending_review" | "published" | "rejected";

export type AdminRole = "visitor" | "admin";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: "admin";
}

/** Payload enviado ao backend em cada ação de revisão */
export interface AdminReviewAction {
  profileId: string;
  action: "approved" | "rejected";
  adminId: string;
  reason?: string;
  note?: string;
  timestamp: string;
}

export interface MockUser {
  id: string;
  role: Exclude<AuthRole, "visitor">;
  fullName: string;
  email: string;
  password: string;
  label: string;
  phone?: string;
  cpf?: string;
  alias?: string;
  city?: string;
  plan?: PlanTier;
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
  age: number;
  heightCm: number;
  weightKg: number;
  ethnicity: string;
  eyeColor: string;
  hairType: string;
  hairColor: string;
  services: string[];
  serviceOptions: string[];
  fetishOptions: string[];
  fetishCustom: string;
  pricingTable: Array<{ label: string; price: number }>;
  paymentMethods?: string[];
  status: AvailabilityStatus;
  adTier: AdCategory;
  images: string[];
  profileImage?: string;
  profileImageIndex?: number;
  rating: number;
  reviewsCount: number;
  profileViews: number;
  /** Moderação: undefined em dados legados = tratado como published */
  verificationStatus?: VerificationStatus;
  /** Data de submissão para revisão (ISO string) */
  submittedAt?: string;
  /** Motivo da recusa, preenchido pelo admin */
  rejectionReason?: string;
  /** Suspensão administrativa */
  isSuspended?: boolean;
  /** Número WhatsApp no formato internacional (ex: "5511999998888") */
  whatsappNumber?: string;
  /** Username do Telegram (sem @) */
  telegramUsername?: string;
}

export interface MockClient {
  id: string;
  fullName: string;
  email: string;
  cpf: string;
  city: string;
  state: string;
  registeredAt: string;
  status: "active" | "suspended";
  suspensionReason?: string;
  totalBookings: number;
}

export interface AdminActivityLog {
  id: string;
  action:
    | "profile_approved"
    | "profile_rejected"
    | "profile_submitted"
    | "client_registered"
    | "account_suspended"
    | "account_reinstated";
  targetName: string;
  targetId?: string;
  adminEmail?: string;
  reason?: string;
  timestamp: string;
}

export interface WeeklySignup {
  label: string;
  clients: number;
  professionals: number;
}

export interface DashboardStats {
  totalClients: number;
  totalProfessionals: number;
  pendingReview: number;
  newThisWeek: number;
  weeklySignups: WeeklySignup[];
  recentActivity: AdminActivityLog[];
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
  participantId: string;
  contactName: string;
  contactStatus: "online" | "offline";
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  currentUserAlias?: string;
  isBlocked?: boolean;
  deletedFromInboxAt?: string | null;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "failed";
export type MessageType = "text" | "media";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "cliente" | "profissional" | "suporte";
  senderDisplayName: string;
  from: "me" | "other";
  content?: string;
  messageType: MessageType;
  status: MessageStatus;
  media?: {
    id: string;
    kind: "image" | "video";
    name: string;
    isViewOnce: boolean;
    openedAt?: string | null;
  };
  sentAt: string;
  deliveredAt?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;
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

// ── Painel Admin — Denúncias ──────────────────────────────────────────────────

export type ReportType =
  | "fake_profile"
  | "scam"
  | "harassment"
  | "inappropriate_content"
  | "other";

export type ReportStatus = "pending" | "under_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  type: ReportType;
  /** Quem fez a denúncia */
  reporterName: string;
  reporterRole: "cliente" | "profissional";
  /** Quem foi denunciado */
  reportedName: string;
  reportedId?: string;
  reportedRole: "cliente" | "profissional";
  description: string;
  status: ReportStatus;
  /** Motivo/nota da resolução */
  resolution?: string;
  createdAt: string;
  updatedAt?: string;
}

// ── Busca Global ──────────────────────────────────────────────────────────────

export interface GlobalSearchResult {
  type: "client" | "professional";
  id: string;
  name: string;
  subtitle: string;
  href: string;
  status?: string;
}
