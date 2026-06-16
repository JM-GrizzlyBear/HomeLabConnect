import { z } from "zod";
import { DayOfWeekSchema, ShiftOverrideTypeSchema } from "./enums";
import { isoDate, isoDateTime, timeOfDay, uuid } from "./primitives";

export const MedTeamMemberSchema = z.object({
  id: uuid,
  userId: uuid,
  licenseNumber: z.string().nullable(),
  specialization: z.string().nullable(),
  serviceAreaCity: z.string().nullable(),
  isAvailable: z.boolean(),
  rating: z.number().min(0).max(5).nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type MedTeamMember = z.infer<typeof MedTeamMemberSchema>;

export const UpsertMedTeamProfileInputSchema = z.object({
  licenseNumber: z.string().max(120).optional().nullable(),
  specialization: z.string().max(160).optional().nullable(),
  serviceAreaCity: z.string().max(120).optional().nullable(),
  isAvailable: z.boolean().optional(),
});
export type UpsertMedTeamProfileInput = z.infer<
  typeof UpsertMedTeamProfileInputSchema
>;

/* --- Med team shifts (recurring) --- */
export const MedTeamShiftSchema = z.object({
  id: uuid,
  medTeamMemberId: uuid,
  dayOfWeek: DayOfWeekSchema,
  shiftStart: timeOfDay,
  shiftEnd: timeOfDay,
  isActive: z.boolean(),
  effectiveFrom: isoDate,
  effectiveUntil: isoDate.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type MedTeamShift = z.infer<typeof MedTeamShiftSchema>;

export const CreateMedTeamShiftInputSchema = z.object({
  medTeamMemberId: uuid,
  dayOfWeek: DayOfWeekSchema,
  shiftStart: timeOfDay,
  shiftEnd: timeOfDay,
  isActive: z.boolean().optional().default(true),
  effectiveFrom: isoDate,
  effectiveUntil: isoDate.optional().nullable(),
});
export type CreateMedTeamShiftInput = z.infer<
  typeof CreateMedTeamShiftInputSchema
>;

export const UpdateMedTeamShiftInputSchema = z.object({
  id: uuid,
  dayOfWeek: DayOfWeekSchema.optional(),
  shiftStart: timeOfDay.optional(),
  shiftEnd: timeOfDay.optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: isoDate.optional(),
  effectiveUntil: isoDate.nullable().optional(),
});
export type UpdateMedTeamShiftInput = z.infer<
  typeof UpdateMedTeamShiftInputSchema
>;

/* --- Med team shift overrides (one-off) --- */
export const MedTeamShiftOverrideSchema = z.object({
  id: uuid,
  medTeamMemberId: uuid,
  overrideDate: isoDate,
  overrideType: ShiftOverrideTypeSchema,
  shiftStart: timeOfDay.nullable(),
  shiftEnd: timeOfDay.nullable(),
  reason: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type MedTeamShiftOverride = z.infer<typeof MedTeamShiftOverrideSchema>;

export const CreateMedTeamShiftOverrideInputSchema = z
  .object({
    medTeamMemberId: uuid,
    overrideDate: isoDate,
    overrideType: ShiftOverrideTypeSchema,
    shiftStart: timeOfDay.optional().nullable(),
    shiftEnd: timeOfDay.optional().nullable(),
    reason: z.string().max(500).optional().nullable(),
  })
  .refine(
    (v) =>
      v.overrideType === "day_off" ||
      (v.shiftStart != null && v.shiftEnd != null),
    {
      message:
        "shiftStart and shiftEnd are required unless overrideType is 'day_off'",
    },
  );
export type CreateMedTeamShiftOverrideInput = z.infer<
  typeof CreateMedTeamShiftOverrideInputSchema
>;
