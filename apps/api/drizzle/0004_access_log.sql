CREATE TABLE "access_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "access_log_created_idx" ON "access_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "access_log_user_idx" ON "access_log" USING btree ("user_id","created_at");