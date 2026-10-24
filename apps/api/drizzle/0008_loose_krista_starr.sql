CREATE TABLE "med_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"area" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_roster_members" (
	"roster_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "team_roster_members_roster_id_user_id_pk" PRIMARY KEY("roster_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team_rosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"lead_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team_roster_members" ADD CONSTRAINT "team_roster_members_roster_id_team_rosters_id_fk" FOREIGN KEY ("roster_id") REFERENCES "public"."team_rosters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_roster_members" ADD CONSTRAINT "team_roster_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rosters" ADD CONSTRAINT "team_rosters_team_id_med_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."med_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_rosters" ADD CONSTRAINT "team_rosters_lead_user_id_users_id_fk" FOREIGN KEY ("lead_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "med_teams_name_lower_idx" ON "med_teams" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "team_rosters_team_period_idx" ON "team_rosters" USING btree ("team_id","period_start");