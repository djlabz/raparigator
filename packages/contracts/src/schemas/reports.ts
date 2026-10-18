import { z } from "zod";
import {
  MEDIA_MAX_IMAGE_BYTES,
  MediaAssetStatusSchema,
  MediaKindSchema,
} from "./announcement-media";
import { IdSchema, SlugSchema } from "./common";

export const REPORT_RESPONSE_SLA_HOURS = 48;
export const REPORT_EVIDENCE_MAX_FILES = 3;
export const REPORT_EVIDENCE_MAX_BYTES = MEDIA_MAX_IMAGE_BYTES;
export const REPORT_EVIDENCE_RETENTION_DAYS = 180;
export const REPORT_EVIDENCE_UNCONFIRMED_HOURS = 24;

export const ReportSourceSchema = z.enum(["chat", "public"]);
export type ReportSource = z.infer<typeof ReportSourceSchema>;

export const PublicReportReasonSchema = z.enum([
  "photo_without_consent",
  "minor",
  "coercion",
  "illegal_content",
  "other",
]);
export type PublicReportReason = z.infer<typeof PublicReportReasonSchema>;

export const ReportActionSchema = z.enum(["remove_media", "unpublish_profile", "dismiss"]);
export type ReportAction = z.infer<typeof ReportActionSchema>;

export const ReportEvidenceFileInputSchema = z.object({
  contentType: z.string().regex(/^image\/[a-z0-9.+-]+$/),
  sizeBytes: z.number().int().positive().max(REPORT_EVIDENCE_MAX_BYTES),
});
export type ReportEvidenceFileInput = z.infer<typeof ReportEvidenceFileInputSchema>;

export const CreatePublicReportInputSchema = z
  .object({
    targetUrl: z.url().max(500).optional(),
    profileSlug: SlugSchema.optional(),
    reason: PublicReportReasonSchema,
    details: z.string().trim().min(10).max(4000),
    contactEmail: z.email().max(200).optional(),
    evidence: z.array(ReportEvidenceFileInputSchema).max(REPORT_EVIDENCE_MAX_FILES).default([]),
  })
  .refine((input) => Boolean(input.targetUrl || input.profileSlug), {
    message: "Informe o link ou o endereço do anúncio.",
    path: ["targetUrl"],
  });
export type CreatePublicReportInput = z.infer<typeof CreatePublicReportInputSchema>;

export const ReportEvidenceUploadSchema = z.object({
  uploadUrl: z.string(),
  method: z.literal("PUT"),
  headers: z.record(z.string(), z.string()),
  expiresAt: z.string(),
});
export type ReportEvidenceUpload = z.infer<typeof ReportEvidenceUploadSchema>;

export const CreatePublicReportOutputSchema = z.object({
  reportId: z.string(),
  responseSlaHours: z.number(),
  evidenceUploads: z.array(ReportEvidenceUploadSchema),
});
export type CreatePublicReportOutput = z.infer<typeof CreatePublicReportOutputSchema>;

export const ReportEvidenceSchema = z.object({
  id: z.string(),
  contentType: z.string(),
  sizeBytes: z.number(),
  url: z.string(),
  createdAt: z.string(),
});
export type ReportEvidence = z.infer<typeof ReportEvidenceSchema>;

export const ReportTargetMediaSchema = z.object({
  id: z.string(),
  kind: MediaKindSchema,
  status: MediaAssetStatusSchema,
  contentType: z.string(),
  url: z.string().nullable(),
  isProfileImage: z.boolean(),
  createdAt: z.string(),
});
export type ReportTargetMedia = z.infer<typeof ReportTargetMediaSchema>;

export const ActOnReportInputSchema = z.object({
  id: IdSchema,
  action: ReportActionSchema,
  assetId: IdSchema.optional(),
  note: z.string().trim().max(1000).default(""),
});
export type ActOnReportInput = z.infer<typeof ActOnReportInputSchema>;

export const CompleteReportEvidenceInputSchema = z.object({ reportId: IdSchema });
export type CompleteReportEvidenceInput = z.infer<typeof CompleteReportEvidenceInputSchema>;

export const CompleteReportEvidenceOutputSchema = z.object({ confirmed: z.number().int() });
export type CompleteReportEvidenceOutput = z.infer<typeof CompleteReportEvidenceOutputSchema>;

export const ReportContactSchema = z.object({ contactEmail: z.string().nullable() });
export type ReportContact = z.infer<typeof ReportContactSchema>;
