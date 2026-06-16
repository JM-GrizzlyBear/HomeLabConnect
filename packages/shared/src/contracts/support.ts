import { z } from "zod";
import { DayOfWeekSchema, ShiftOverrideTypeSchema } from "./enums";
import { isoDate, isoDateTime, timeOfDay, uuid } from "./primitives";

export const SupportAgentSchema = z.object({
  id: uuid,
  userId: uuid,
  isOnline: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type SupportAgent = z.infer<typeof SupportAgentSchema>;

export const UpsertSupportAgentProfileInputSchema = z.object({
  isOnline: z.boolean().optional(),
});
export type UpsertSupportAgentProfileInput = z.infer<
  typeof UpsertSupportAgentProfileInputSchema
>;

/* --- Support shifts (recurring) --- */
export const SupportShiftSchema = z.object({
  id: uuid,
  supportAgentId: uuid,
  dayOfWeek: DayOfWeekSchema,
  shiftStart: timeOfDay,
  shiftEnd: timeOfDay,
  isActive: z.boolean(),
  effectiveFrom: isoDate,
  effectiveUntil: isoDate.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type SupportShift = z.infer<typeof SupportShiftSchema>;

export const CreateSupportShiftInputSchema = z.object({
  supportAgentId: uuid,
  dayOfWeek: DayOfWeekSchema,
  shiftStart: timeOfDay,
  shiftEnd: timeOfDay,
  isActive: z.boolean().optional().default(true),
  effectiveFrom: isoDate,
  effectiveUntil: isoDate.optional().nullable(),
});
export type CreateSupportShiftInput = z.infer<
  typeof CreateSupportShiftInputSchema
>;

export const UpdateSupportShiftInputSchema = z.object({
  id: uuid,
  dayOfWeek: DayOfWeekSchema.optional(),
  shiftStart: timeOfDay.optional(),
  shiftEnd: timeOfDay.optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: isoDate.optional(),
  effectiveUntil: isoDate.nullable().optional(),
});
export type UpdateSupportShiftInput = z.infer<
  typeof UpdateSupportShiftInputSchema
>;

/* --- Support shift overrides (one-off) --- */
export const SupportShiftOverrideSchema = z.object({
  id: uuid,
  supportAgentId: uuid,
  overrideDate: isoDate,
  overrideType: ShiftOverrideTypeSchema,
  shiftStart: timeOfDay.nullable(),
  shiftEnd: timeOfDay.nullable(),
  reason: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type SupportShiftOverride = z.infer<typeof SupportShiftOverrideSchema>;

export const CreateSupportShiftOverrideInputSchema = z
  .object({
    supportAgentId: uuid,
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
export type CreateSupportShiftOverrideInput = z.infer<
  typeof CreateSupportShiftOverrideInputSchema
>;
