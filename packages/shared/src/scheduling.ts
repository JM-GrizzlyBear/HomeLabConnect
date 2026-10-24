import { z } from "zod";
import { baseRoleSchema } from "./auth.js";
import { halfHourSchema } from "./settings.js";

export const personSchema = z.object({ id: z.uuid(), name: z.string() });

export const medTeamRequestSchema = z.object({
  name: z.string().trim().min(1, "Enter a team name.").max(60, "Name is too long."),
  area: z.string().trim().max(120, "Keep this under 120 characters.").nullable(),
});

export const teamStatusRequestSchema = z.object({ isActive: z.boolean() });

/** Who is on a team for one two-week period. No members clears the roster. */
export const rosterRequestSchema = z
  .object({
    leadUserId: z.uuid().nullable(),
    memberIds: z.array(z.uuid()),
  })
  .superRefine((roster, ctx) => {
    if (roster.memberIds.length > 0 && !roster.leadUserId) {
      ctx.addIssue({ code: "custom", path: ["leadUserId"], message: "Choose the team lead." });
    } else if (roster.leadUserId && !roster.memberIds.includes(roster.leadUserId)) {
      ctx.addIssue({
        code: "custom",
        path: ["leadUserId"],
        message: "The team lead must be one of the members.",
      });
    }
  });

/** A team with its roster for the period being viewed. */
export const medTeamSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  area: z.string().nullable(),
  isActive: z.boolean(),
  lead: personSchema.nullable(),
  members: z.array(personSchema),
});

/** A team without its roster, returned after creating or changing it. */
export const teamSummarySchema = medTeamSchema.pick({
  id: true,
  name: true,
  area: true,
  isActive: true,
});

export const teamBoardSchema = z.object({
  /** First and last day of the two-week period (Monday to Sunday). */
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  teams: z.array(medTeamSchema),
  /** Active med team staff on no team this period. */
  unassigned: z.array(personSchema),
});

export const listTeamsQuerySchema = z.object({
  /** Any day in the wanted period; today when left out. */
  date: z.iso.date().optional(),
});

export const teamIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });
export const rosterParamsSchema = z.object({
  id: z.uuid("Not a valid id."),
  periodStart: z.iso.date("Not a valid date."),
});
export const periodParamsSchema = z.object({ periodStart: z.iso.date("Not a valid date.") });

export const copyRostersResponseSchema = z.object({ copied: z.number().int().nonnegative() });

export const staffMemberSchema = z.object({
  id: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  role: baseRoleSchema,
});
export const staffListSchema = z.array(staffMemberSchema);
export const listStaffQuerySchema = z.object({ role: baseRoleSchema.optional() });

export type Person = z.infer<typeof personSchema>;
export type MedTeamRequest = z.infer<typeof medTeamRequestSchema>;
export type RosterRequest = z.infer<typeof rosterRequestSchema>;
export type MedTeam = z.infer<typeof medTeamSchema>;
export type TeamSummary = z.infer<typeof teamSummarySchema>;
export type TeamBoard = z.infer<typeof teamBoardSchema>;
export type StaffMember = z.infer<typeof staffMemberSchema>;

const minutesOf = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
};

/** Working hours, e.g. 08:00 to 17:00. */
export const shiftHoursSchema = z
  .object({ start: halfHourSchema, end: halfHourSchema })
  .refine((hours) => minutesOf(hours.end) > minutesOf(hours.start), {
    path: ["end"],
    message: "End after the start time.",
  });

/** The most days one change may cover. */
export const MAX_SHIFT_DATES = 62;

/** Days picked on the calendar, all given the same hours, or made days off with null. */
export const shiftDaysRequestSchema = z.object({
  dates: z
    .array(z.iso.date())
    .min(1, "Choose at least one day.")
    .max(MAX_SHIFT_DATES, `Change at most ${MAX_SHIFT_DATES} days at a time.`),
  hours: shiftHoursSchema.nullable(),
});

export const dayStatusSchema = z.enum(["working", "off", "closed", "leave"]);

export const scheduleDaySchema = z.object({
  date: z.iso.date(),
  status: dayStatusSchema,
  /** The shift's hours; kept on leave days too. */
  start: z.string().nullable(),
  end: z.string().nullable(),
  /** The closed day's name. */
  label: z.string().nullable(),
});
export const scheduleDayListSchema = z.array(scheduleDaySchema);

export const shiftBoardSchema = z.array(
  z.object({
    person: staffMemberSchema,
    days: z.array(scheduleDaySchema),
  }),
);

export const scheduleRangeQuerySchema = z.object({
  from: z.iso.date("Not a valid date."),
  to: z.iso.date("Not a valid date."),
  role: baseRoleSchema.optional(),
});

export const shiftUserParamsSchema = z.object({ userId: z.uuid("Not a valid id.") });
export const shiftDaysResponseSchema = z.object({ changed: z.number().int().nonnegative() });

export type ShiftHours = z.infer<typeof shiftHoursSchema>;
export type ShiftDaysRequest = z.infer<typeof shiftDaysRequestSchema>;
export type DayStatus = z.infer<typeof dayStatusSchema>;
export type ScheduleDay = z.infer<typeof scheduleDaySchema>;
export type ShiftBoard = z.infer<typeof shiftBoardSchema>;

export const leaveTypeSchema = z.enum(["vacation", "sick", "emergency", "other"], {
  error: "Choose a type of leave.",
});
export const leaveStatusSchema = z.enum(["pending", "approved", "rejected", "cancelled"]);
export const approvalStepSchema = z.enum(["team_lead", "admin"]);

export const leaveRequestBodySchema = z
  .object({
    type: leaveTypeSchema,
    /** First and last day off, both included. */
    startsOn: z.iso.date("Choose the first day."),
    endsOn: z.iso.date("Choose the last day."),
    reason: z.string().trim().min(1, "Give a reason.").max(300, "Keep this under 300 characters."),
  })
  .refine((leave) => leave.endsOn >= leave.startsOn, {
    path: ["endsOn"],
    message: "The last day can't be before the first.",
  });

export const leaveDecisionRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(300, "Keep this under 300 characters.").nullable(),
});

export const leaveViewSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  requesterName: z.string(),
  type: leaveTypeSchema,
  startsOn: z.iso.date(),
  endsOn: z.iso.date(),
  reason: z.string(),
  status: leaveStatusSchema,
  chain: z.array(approvalStepSchema),
  /** The step waiting for a decision; null once decided or cancelled. */
  waitingFor: approvalStepSchema.nullable(),
  decisions: z.array(
    z.object({
      step: z.number().int(),
      approverName: z.string(),
      decision: z.enum(["approved", "rejected"]),
      note: z.string().nullable(),
      decidedAt: z.iso.datetime(),
    }),
  ),
});
export const leaveListSchema = z.array(leaveViewSchema);

export const listLeaveQuerySchema = z.object({ status: leaveStatusSchema.optional() });
export const leaveIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

export type LeaveType = z.infer<typeof leaveTypeSchema>;
export type LeaveStatus = z.infer<typeof leaveStatusSchema>;
export type ApprovalStep = z.infer<typeof approvalStepSchema>;
export type LeaveRequestBody = z.infer<typeof leaveRequestBodySchema>;
export type LeaveDecisionRequest = z.infer<typeof leaveDecisionRequestSchema>;
export type LeaveView = z.infer<typeof leaveViewSchema>;
