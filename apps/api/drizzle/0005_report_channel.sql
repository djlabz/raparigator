CREATE TABLE "blocked_image_hash" (
	"id" text PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"report_id" text NOT NULL,
	"source_asset_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "reporter_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "reporter_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "reported_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "reported_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "block_reason" text;--> statement-breakpoint
ALTER TABLE "media_asset" ADD COLUMN "blocked_by_report_id" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "source" text DEFAULT 'chat' NOT NULL;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "target_profile_id" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "target_url" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "profile_slug" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "action" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "action_target_id" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "action_admin_id" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "action_admin_email" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "responded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "admin_notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blocked_image_hash" ADD CONSTRAINT "blocked_image_hash_report_id_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_evidence" ADD CONSTRAINT "report_evidence_report_id_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocked_image_hash_report_idx" ON "blocked_image_hash" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "report_evidence_report_idx" ON "report_evidence" USING btree ("report_id");--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_target_profile_id_professional_profile_id_fk" FOREIGN KEY ("target_profile_id") REFERENCES "public"."professional_profile"("id") ON DELETE set null ON UPDATE no action;