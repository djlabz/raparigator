ALTER TABLE "professional_profile" ALTER COLUMN "verification_status" SET DEFAULT 'draft';--> statement-breakpoint
UPDATE "professional_profile" SET "verification_status" = 'draft' WHERE "verification_status" = 'pending_review' AND "submitted_at" IS NULL;
