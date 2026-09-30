CREATE TABLE "lab_procedures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category_id" uuid NOT NULL,
	"price_centavos" integer NOT NULL,
	"specimen" text NOT NULL,
	"turnaround_hours" integer NOT NULL,
	"fasting_hours" integer DEFAULT 0 NOT NULL,
	"preparation" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_procedures_code_unique" UNIQUE("code"),
	CONSTRAINT "lab_procedures_price_positive" CHECK ("lab_procedures"."price_centavos" > 0)
);
--> statement-breakpoint
CREATE TABLE "procedure_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lab_procedures" ADD CONSTRAINT "lab_procedures_category_id_procedure_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."procedure_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lab_procedures_name_lower_idx" ON "lab_procedures" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "procedure_categories_name_lower_idx" ON "procedure_categories" USING btree (lower("name"));