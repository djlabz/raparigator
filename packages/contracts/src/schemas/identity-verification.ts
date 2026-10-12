import { z } from "zod";
import { MEDIA_MAX_IMAGE_BYTES } from "./announcement-media";
import { IdSchema } from "./common";

export const IDENTITY_VERIFICATION_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const IDENTITY_VERIFICATION_MAX_BYTES = MEDIA_MAX_IMAGE_BYTES;

export const IdentityVerificationStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type IdentityVerificationStatus = z.infer<typeof IdentityVerificationStatusSchema>;

export const IdentityVerificationFileKindSchema = z.enum(["document", "selfie"]);
export type IdentityVerificationFileKind = z.infer<typeof IdentityVerificationFileKindSchema>;

export const IdentityVerificationContentTypeSchema = z.enum(IDENTITY_VERIFICATION_CONTENT_TYPES);
export type IdentityVerificationContentType = z.infer<typeof IdentityVerificationContentTypeSchema>;

export const IdentityVerificationUploadInputSchema = z.object({
  kind: IdentityVerificationFileKindSchema,
  contentType: IdentityVerificationContentTypeSchema,
  sizeBytes: z.number().int().positive().max(IDENTITY_VERIFICATION_MAX_BYTES),
});
export type IdentityVerificationUploadInput = z.infer<typeof IdentityVerificationUploadInputSchema>;

export const IdentityVerificationUploadOutputSchema = z.object({
  key: z.string(),
  uploadUrl: z.string(),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string(),
});
export type IdentityVerificationUploadOutput = z.infer<
  typeof IdentityVerificationUploadOutputSchema
>;

export const IdentityVerificationSubmitInputSchema = z.object({
  documentKey: z.string().min(1).max(300),
  selfieKey: z.string().min(1).max(300),
});
export type IdentityVerificationSubmitInput = z.infer<typeof IdentityVerificationSubmitInputSchema>;

export const IdentityVerificationMineSchema = z.object({
  required: z.boolean(),
  status: IdentityVerificationStatusSchema.nullable(),
  rejectReason: z.string().nullable(),
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
});
export type IdentityVerificationMine = z.infer<typeof IdentityVerificationMineSchema>;

export const IdentityVerificationSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  artisticName: z.string().nullable(),
  profileSlug: z.string().nullable(),
  status: IdentityVerificationStatusSchema,
  rejectReason: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  filesAvailable: z.boolean(),
  createdAt: z.string(),
});
export type IdentityVerificationSummary = z.infer<typeof IdentityVerificationSummarySchema>;

export const IdentityVerificationFilesSchema = z.object({
  id: z.string(),
  documentUrl: z.string(),
  selfieUrl: z.string(),
  expiresInSeconds: z.number(),
});
export type IdentityVerificationFiles = z.infer<typeof IdentityVerificationFilesSchema>;

export const IdentityVerificationListInputSchema = z.object({
  status: IdentityVerificationStatusSchema.optional(),
});
export type IdentityVerificationListInput = z.infer<typeof IdentityVerificationListInputSchema>;

export const IdentityVerificationRejectInputSchema = z.object({
  id: IdSchema,
  reason: z.string().trim().min(3).max(500),
});
export type IdentityVerificationRejectInput = z.infer<typeof IdentityVerificationRejectInputSchema>;
