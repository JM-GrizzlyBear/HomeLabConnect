CREATE TYPE "public"."day_of_week" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');--> statement-breakpoint
CREATE TABLE "med_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"license_number" varchar(120),
	"specialization" varchar(160),
	"service_area_city" varchar(120),
	"is_available" boolean DEFAULT true NOT NULL,
	"rating" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "med_team_members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "med_team_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"med_team_member_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"shift_start" time NOT NULL,
	"shift_end" time NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "med_team_members" ADD CONSTRAINT "med_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "med_team_shifts" ADD CONSTRAINT "med_team_shifts_member_id_med_team_members_id_fk" FOREIGN KEY ("med_team_member_id") REFERENCES "public"."med_team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "med_team_shifts_member_day_start_from_unique" ON "med_team_shifts" USING btree ("med_team_member_id","day_of_week","shift_start","effective_from");