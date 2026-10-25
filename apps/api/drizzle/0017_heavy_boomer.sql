ALTER TABLE "appointment_procedures" ADD COLUMN "collected" boolean;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "collection_note" text;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_team_id_med_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."med_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_team_idx" ON "appointments" USING btree ("team_id","visit_date");