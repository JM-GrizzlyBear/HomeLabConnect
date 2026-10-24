CREATE TABLE "appointment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"kind" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "appointment_procedures" (
	"appointment_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"price_centavos" integer NOT NULL,
	"promotion_id" uuid,
	"promotion_name" text,
	"discount_centavos" integer NOT NULL,
	CONSTRAINT "appointment_procedures_appointment_id_procedure_id_pk" PRIMARY KEY("appointment_id","procedure_id")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "appointments_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"patient_user_id" uuid NOT NULL,
	"visit_date" date NOT NULL,
	"slot_start" text NOT NULL,
	"status" text NOT NULL,
	"address" text NOT NULL,
	"landmark" text,
	"patient_notes" text,
	"subtotal_centavos" integer NOT NULL,
	"discount_centavos" integer NOT NULL,
	"total_centavos" integer NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"decision_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "reschedule_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"proposed_date" date NOT NULL,
	"proposed_slot" text NOT NULL,
	"reason" text NOT NULL,
	"proposed_by" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_procedures" ADD CONSTRAINT "appointment_procedures_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_procedures" ADD CONSTRAINT "appointment_procedures_procedure_id_lab_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."lab_procedures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_procedures" ADD CONSTRAINT "appointment_procedures_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_user_id_users_id_fk" FOREIGN KEY ("patient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reschedule_proposals" ADD CONSTRAINT "reschedule_proposals_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reschedule_proposals" ADD CONSTRAINT "reschedule_proposals_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointment_events_appointment_idx" ON "appointment_events" USING btree ("appointment_id","at");--> statement-breakpoint
CREATE INDEX "appointments_visit_idx" ON "appointments" USING btree ("visit_date","slot_start","status");--> statement-breakpoint
CREATE INDEX "appointments_patient_idx" ON "appointments" USING btree ("patient_user_id","visit_date");--> statement-breakpoint
CREATE INDEX "reschedule_proposals_appointment_idx" ON "reschedule_proposals" USING btree ("appointment_id");