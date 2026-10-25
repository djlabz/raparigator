import type { AdminUser as ContractAdminUser } from "@sigillus/contracts";

export type {
  AdminActivityLog,
  AdminReviewAction,
  AuthRole,
  AvailabilityStatus,
  Conversation,
  DashboardStats,
  EncounterBrief,
  GlobalSearchResult,
  Message,
  PremiumBillingCycle,
  ProfessionalAd,
  Report,
  ReportStatus,
  ReportType,
  SimulationSelection,
  User,
  VerificationStatus,
} from "@sigillus/contracts";

export type AdminUser = ContractAdminUser & {
  password?: string;
};
