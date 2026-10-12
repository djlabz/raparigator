CREATE TABLE "identity_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_key" text,
	"selfie_key" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"reject_reason" text,
	"files_deleted_at" timestamp with time zone,
	"admin_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "identity_verification" ADD CONSTRAINT "identity_verification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "identity_verification_active_user_key" ON "identity_verification" USING btree ("user_id") WHERE "identity_verification"."status" <> 'rejected';--> statement-breakpoint
CREATE INDEX "identity_verification_user_idx" ON "identity_verification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "identity_verification_status_idx" ON "identity_verification" USING btree ("status","created_at");