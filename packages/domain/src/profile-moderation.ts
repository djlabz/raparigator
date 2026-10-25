import type { VerificationStatus } from "@sigillus/contracts";

export type ProfileReviewAction = "approve" | "reject";

export type ProfilePublishTransition = {
  status: VerificationStatus;
  needsReview: boolean;
};

export const PROFILE_INITIAL_STATUS: VerificationStatus = "draft";

export const PROFILE_REVIEWABLE_STATUS: VerificationStatus = "pending_review";

export const PROFILE_REVIEW_REQUIRED_MESSAGE =
  "Só é possível decidir um anúncio que está em análise.";

export function canReview(status: VerificationStatus): boolean {
  return status === PROFILE_REVIEWABLE_STATUS;
}

export function transitionOnPublish(status: VerificationStatus): ProfilePublishTransition {
  if (status === "published") {
    return { status: "published", needsReview: false };
  }
  return { status: "pending_review", needsReview: true };
}

export function transitionOnReview(action: ProfileReviewAction): VerificationStatus {
  return action === "approve" ? "published" : "rejected";
}
