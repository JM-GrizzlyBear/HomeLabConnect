import { z } from "zod";

export const RoleSchema = z.enum([
  "patient",
  "med_team",
  "doctor",
  "support",
  "admin",
]);
export type Role = z.infer<typeof RoleSchema>;

export const GenderSchema = z.enum([
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);
export type Gender = z.infer<typeof GenderSchema>;

export const DayOfWeekSchema = z.enum([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

export const ShiftOverrideTypeSchema = z.enum([
  "day_off",
  "custom_hours",
  "extra_shift",
]);
export type ShiftOverrideType = z.infer<typeof ShiftOverrideTypeSchema>;

export const LabProcedureCategorySchema = z.enum([
  "blood_test",
  "urine_test",
  "xray",
  "ecg",
  "ultrasound",
  "other",
]);
export type LabProcedureCategory = z.infer<typeof LabProcedureCategorySchema>;

export const AppointmentStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "reschedule_proposed",
  "rescheduled",
  "in_progress",
  "completed",
  "cancelled",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const ResultStatusSchema = z.enum([
  "pending",
  "collected",
  "processing",
  "ready",
  "delivered",
]);
export type ResultStatus = z.infer<typeof ResultStatusSchema>;

export const AssignmentRoleSchema = z.enum(["lead", "assistant"]);
export type AssignmentRole = z.infer<typeof AssignmentRoleSchema>;

export const RescheduleStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "superseded",
]);
export type RescheduleStatus = z.infer<typeof RescheduleStatusSchema>;

export const AppointmentEventTypeSchema = z.enum([
  "created",
  "accepted",
  "rejected",
  "reschedule_proposed",
  "reschedule_accepted",
  "reschedule_rejected",
  "assigned",
  "started",
  "completed",
  "cancelled",
  "note_added",
]);
export type AppointmentEventType = z.infer<typeof AppointmentEventTypeSchema>;

export const ChatConversationTypeSchema = z.enum([
  "patient_support",
  "patient_medteam",
  "appointment_thread",
]);
export type ChatConversationType = z.infer<typeof ChatConversationTypeSchema>;

export const NotificationTypeSchema = z.enum([
  "appointment_created",
  "appointment_accepted",
  "appointment_rejected",
  "reschedule_proposed",
  "reschedule_accepted",
  "new_chat_message",
  "result_ready",
  "system",
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const PermissionCategorySchema = z.enum([
  "chat",
  "dashboard",
  "profile",
  "homepage",
  "appointment",
  "admin",
  "other",
]);
export type PermissionCategory = z.infer<typeof PermissionCategorySchema>;
