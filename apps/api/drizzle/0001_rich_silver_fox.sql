ALTER TABLE "conversation_participant" DROP CONSTRAINT "conversation_participant_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_client_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "conversation" DROP CONSTRAINT "conversation_professional_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "message" DROP CONSTRAINT "message_sender_user_id_user_id_fk";
