CREATE TABLE "employee_shift_overrides" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"kind" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"note" text,
	CONSTRAINT "employee_shift_overrides_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "employee_shifts" (
	"user_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	CONSTRAINT "employee_shifts_user_id_weekday_pk" PRIMARY KEY("user_id","weekday")
);
--> statement-breakpoint
ALTER TABLE "employee_shift_overrides" ADD CONSTRAINT "employee_shift_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_shifts" ADD CONSTRAINT "employee_shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;