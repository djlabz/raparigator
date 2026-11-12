import type { ModerationStatus } from "@sigillus/contracts";

export type ProfileReviewAction = "approve" | "reject";

export type ProfilePublishTransition = {
  status: ModerationStatus;
  needsReview: boolean;
};

export const PROFILE_INITIAL_STATUS: ModerationStatus = "draft";

export const PROFILE_REVIEWABLE_STATUS: ModerationStatus = "pending_review";

export const PROFILE_REVIEW_REQUIRED_MESSAGE =
  "Só é possível decidir um anúncio que está em análise.";

export function canReview(status: ModerationStatus): boolean {
  return status === PROFILE_REVIEWABLE_STATUS;
}

export function transitionOnPublish(status: ModerationStatus): ProfilePublishTransition {
  if (status === "published") {
    return { status: "published", needsReview: false };
  }
  return { status: "pending_review", needsReview: true };
}

export function transitionOnReview(action: ProfileReviewAction): ModerationStatus {
  return action === "approve" ? "published" : "rejected";
}
