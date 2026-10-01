CREATE TABLE "promotion_procedures" (
	"promotion_id" uuid NOT NULL,
	"procedure_id" uuid NOT NULL,
	CONSTRAINT "promotion_procedures_promotion_id_procedure_id_pk" PRIMARY KEY("promotion_id","procedure_id")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_type" text NOT NULL,
	"value" integer NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"applies_to" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_value_positive" CHECK ("promotions"."value" > 0),
	CONSTRAINT "promotions_dates_in_order" CHECK ("promotions"."ends_on" >= "promotions"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "promotion_procedures" ADD CONSTRAINT "promotion_procedures_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_procedures" ADD CONSTRAINT "promotion_procedures_procedure_id_lab_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."lab_procedures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_name_lower_idx" ON "promotions" USING btree (lower("name"));