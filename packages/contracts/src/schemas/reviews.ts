import { z } from "zod";
import { ReviewSchema } from "./ad";

export const ReviewInviteSchema = z.object({
  conversationId: z.string(),
  adSlug: z.string(),
  invitedAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullable().optional(),
});
export type ReviewInvite = z.infer<typeof ReviewInviteSchema>;

export const SubmittedReviewSchema = z.object({
  id: z.string(),
  adSlug: z.string(),
  conversationId: z.string(),
  author: z.string(),
  score: z.number(),
  comment: z.string(),
  createdAt: z.string(),
});
export type SubmittedReview = z.infer<typeof SubmittedReviewSchema>;

export const InviteStatusSchema = z.enum(["none", "open", "expired", "used"]);
export type InviteStatus = z.infer<typeof InviteStatusSchema>;

export const AdReviewsSummarySchema = z.object({
  reviews: z.array(ReviewSchema),
  rating: z.number(),
  reviewsCount: z.number(),
});
export type AdReviewsSummary = z.infer<typeof AdReviewsSummarySchema>;

export const SubmitReviewInputSchema = z.object({
  conversationId: z.string(),
  score: z.number().int().min(1, "Dê uma nota de 1 a 5.").max(5, "Dê uma nota de 1 a 5."),
  comment: z.string().trim().max(1000, "O comentário pode ter até 1.000 caracteres."),
});
export type SubmitReviewInput = z.infer<typeof SubmitReviewInputSchema>;
