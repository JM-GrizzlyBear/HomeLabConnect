import { z } from "zod";

/** 0 = Sunday … 6 = Saturday. */
export const weekdaySchema = z.number().int().min(0).max(6);
export const bookingApprovalSchema = z.enum(["staff", "automatic"]);
export const teamAssignmentSchema = z.enum(["manual", "auto"]);
export const SLOT_LENGTHS = [30, 60, 90] as const;

/** "06:00" or "06:30": visit hours go in half-hour steps. */
export const halfHourSchema = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, "Choose a time.");

const minutesOf = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .number(`Enter ${label}.`)
    .int("Enter a whole number.")
    .min(min, `Enter ${min}–${max}.`)
    .max(max, `Enter ${min}–${max}.`);

export const systemSettingsSchema = z
  .object({
    visitDays: z.array(weekdaySchema).min(1, "Choose at least one visit day."),
    visitStart: halfHourSchema,
    visitEnd: halfHourSchema,
    slotMinutes: z.literal(SLOT_LENGTHS, { error: "Choose a slot length." }),
    minNoticeHours: wholeNumber("the hours", 0, 168),
    bookingWindowDays: wholeNumber("the days", 1, 180),
    cancelCutoffHours: wholeNumber("the hours", 0, 168),
    visitsPerTeamPerDay: wholeNumber("the visits", 1, 50),
    bookingApproval: bookingApprovalSchema,
    teamAssignment: teamAssignmentSchema,
  })
  .superRefine((settings, ctx) => {
    const length = minutesOf(settings.visitEnd) - minutesOf(settings.visitStart);
    if (length <= 0) {
      ctx.addIssue({ code: "custom", path: ["visitEnd"], message: "End after the start time." });
    } else if (length < settings.slotMinutes) {
      ctx.addIssue({
        code: "custom",
        path: ["slotMinutes"],
        message: "A slot must fit in the visit hours.",
      });
    }
    if (settings.minNoticeHours >= settings.bookingWindowDays * 24) {
      ctx.addIssue({
        code: "custom",
        path: ["minNoticeHours"],
        message: "Make this shorter than the booking window.",
      });
    }
  });

export const settingsResponseSchema = z.object({
  settings: systemSettingsSchema,
  /** null until an admin first saves; the defaults apply until then. */
  updatedAt: z.iso.datetime().nullable(),
  updatedBy: z.string().nullable(),
});

export const closedDayKindSchema = z.enum(["holiday", "special_day_off"], {
  error: "Choose a kind.",
});

export const closedDayRequestSchema = z.object({
  date: z.iso.date("Choose the date."),
  name: z.string().trim().min(1, "Enter a name.").max(80, "Name is too long."),
  kind: closedDayKindSchema,
  /** Closed on this month and day every year. */
  repeatsYearly: z.boolean(),
});

export const closedDaySchema = closedDayRequestSchema.extend({ id: z.uuid() });
export const closedDayListSchema = z.array(closedDaySchema);

export const listClosedDaysQuerySchema = z.object({
  /** One-time closed days in this year, plus every yearly one. */
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type Weekday = z.infer<typeof weekdaySchema>;
export type BookingApproval = z.infer<typeof bookingApprovalSchema>;
export type TeamAssignment = z.infer<typeof teamAssignmentSchema>;
export type SystemSettings = z.infer<typeof systemSettingsSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type ClosedDayKind = z.infer<typeof closedDayKindSchema>;
export type ClosedDayRequest = z.infer<typeof closedDayRequestSchema>;
export type ClosedDay = z.infer<typeof closedDaySchema>;
export type ListClosedDaysQuery = z.input<typeof listClosedDaysQuerySchema>;
