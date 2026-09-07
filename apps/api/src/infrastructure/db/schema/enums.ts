import { pgEnum } from "drizzle-orm/pg-core";

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const userRoleEnum = pgEnum("user_role", [
  "patient",
  "med_team",
  "doctor",
  "support",
  "admin",
]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

export const shiftOverrideTypeEnum = pgEnum("shift_override_type", [
  "day_off",
  "custom_hours",
  "extra_shift",
]);

export const labProcedureCategoryEnum = pgEnum("lab_procedure_category", [
  "blood_test",
  "urine_test",
  "xray",
  "ecg",
  "ultrasound",
  "other",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "accepted",
  "rejected",
  "reschedule_proposed",
  "rescheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

export const resultStatusEnum = pgEnum("result_status", [
  "pending",
  "collected",
  "processing",
  "ready",
  "delivered",
]);

export const assignmentRoleEnum = pgEnum("assignment_role", [
  "lead",
  "assistant",
]);

export const rescheduleStatusEnum = pgEnum("reschedule_status", [
  "pending",
  "accepted",
  "rejected",
  "superseded",
]);

export const appointmentEventTypeEnum = pgEnum("appointment_event_type", [
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

export const chatConversationTypeEnum = pgEnum("chat_conversation_type", [
  "patient_support",
  "patient_medteam",
  "appointment_thread",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment_created",
  "appointment_accepted",
  "appointment_rejected",
  "reschedule_proposed",
  "reschedule_accepted",
  "new_chat_message",
  "result_ready",
  "system",
]);

export const permissionCategoryEnum = pgEnum("permission_category", [
  "chat",
  "dashboard",
  "profile",
  "homepage",
  "appointment",
  "admin",
  "other",
]);
