CREATE TABLE "appointment_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"url" text NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"shared_with_patient" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "return_of_id" uuid;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "route_position" smallint;--> statement-breakpoint
ALTER TABLE "appointment_attachments" ADD CONSTRAINT "appointment_attachments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_attachments" ADD CONSTRAINT "appointment_attachments_note_id_appointment_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."appointment_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_attachments" ADD CONSTRAINT "appointment_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_notes" ADD CONSTRAINT "appointment_notes_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_notes" ADD CONSTRAINT "appointment_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_attachments_note_idx" ON "appointment_attachments" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "appointment_notes_appointment_idx" ON "appointment_notes" USING btree ("appointment_id","created_at");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_return_of_id_appointments_id_fk" FOREIGN KEY ("return_of_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;