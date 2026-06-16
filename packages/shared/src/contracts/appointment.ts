import { z } from "zod";
import {
  AppointmentEventTypeSchema,
  AppointmentStatusSchema,
  AssignmentRoleSchema,
  RescheduleStatusSchema,
  ResultStatusSchema,
} from "./enums";
import { isoDateTime, jsonValue, moneyMinor, uuid } from "./primitives";

export const AppointmentSchema = z.object({
  id: uuid,
  patientId: uuid,
  doctorId: uuid.nullable(),
  requestedDate: isoDateTime,
  confirmedDate: isoDateTime.nullable(),
  status: AppointmentStatusSchema,
  serviceAddress: z.string(),
  patientNotes: z.string().nullable(),
  medteamNotes: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  totalPrice: moneyMinor,
  completedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentInputSchema = z.object({
  // patientId is taken from the authed user on the server, NOT from the client
  doctorId: uuid.optional().nullable(),
  requestedDate: isoDateTime,
  serviceAddress: z.string().min(1).max(500),
  patientNotes: z.string().max(2000).optional().nullable(),
  procedureIds: z.array(uuid).min(1, "Pick at least one procedure"),
});
export type CreateAppointmentInput = z.infer<
  typeof CreateAppointmentInputSchema
>;

export const AcceptAppointmentInputSchema = z.object({
  id: uuid,
  confirmedDate: isoDateTime.optional(),
  medteamNotes: z.string().max(2000).optional().nullable(),
});
export type AcceptAppointmentInput = z.infer<
  typeof AcceptAppointmentInputSchema
>;

export const RejectAppointmentInputSchema = z.object({
  id: uuid,
  rejectionReason: z.string().min(1).max(500),
});
export type RejectAppointmentInput = z.infer<
  typeof RejectAppointmentInputSchema
>;

export const CancelAppointmentInputSchema = z.object({
  id: uuid,
  reason: z.string().max(500).optional().nullable(),
});
export type CancelAppointmentInput = z.infer<
  typeof CancelAppointmentInputSchema
>;

export const CompleteAppointmentInputSchema = z.object({
  id: uuid,
  medteamNotes: z.string().max(2000).optional().nullable(),
});
export type CompleteAppointmentInput = z.infer<
  typeof CompleteAppointmentInputSchema
>;

export const ListAppointmentsInputSchema = z.object({
  patientId: uuid.optional(),
  doctorId: uuid.optional(),
  medTeamMemberId: uuid.optional(),
  status: AppointmentStatusSchema.optional(),
  fromDate: isoDateTime.optional(),
  toDate: isoDateTime.optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
export type ListAppointmentsInput = z.infer<typeof ListAppointmentsInputSchema>;

/* --- Appointment procedures (line items) --- */
export const AppointmentProcedureSchema = z.object({
  id: uuid,
  appointmentId: uuid,
  procedureId: uuid,
  priceAtBooking: moneyMinor,
  resultStatus: ResultStatusSchema,
  resultUrl: z.string().url().nullable(),
  notes: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type AppointmentProcedure = z.infer<typeof AppointmentProcedureSchema>;

export const UpdateAppointmentProcedureResultInputSchema = z.object({
  id: uuid,
  resultStatus: ResultStatusSchema,
  resultUrl: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
export type UpdateAppointmentProcedureResultInput = z.infer<
  typeof UpdateAppointmentProcedureResultInputSchema
>;

/* --- Appointment assignments (which med team goes) --- */
export const AppointmentAssignmentSchema = z.object({
  id: uuid,
  appointmentId: uuid,
  medTeamMemberId: uuid,
  role: AssignmentRoleSchema,
  assignedAt: isoDateTime,
});
export type AppointmentAssignment = z.infer<typeof AppointmentAssignmentSchema>;

export const CreateAppointmentAssignmentInputSchema = z.object({
  appointmentId: uuid,
  medTeamMemberId: uuid,
  role: AssignmentRoleSchema.optional().default("lead"),
});
export type CreateAppointmentAssignmentInput = z.infer<
  typeof CreateAppointmentAssignmentInputSchema
>;

/* --- Reschedule proposals --- */
export const RescheduleProposalSchema = z.object({
  id: uuid,
  appointmentId: uuid,
  proposedByUserId: uuid,
  proposedDate: isoDateTime,
  reason: z.string().nullable(),
  status: RescheduleStatusSchema,
  respondedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type RescheduleProposal = z.infer<typeof RescheduleProposalSchema>;

export const CreateRescheduleProposalInputSchema = z.object({
  appointmentId: uuid,
  proposedDate: isoDateTime,
  reason: z.string().max(500).optional().nullable(),
});
export type CreateRescheduleProposalInput = z.infer<
  typeof CreateRescheduleProposalInputSchema
>;

export const RespondRescheduleProposalInputSchema = z.object({
  id: uuid,
  accept: z.boolean(),
});
export type RespondRescheduleProposalInput = z.infer<
  typeof RespondRescheduleProposalInputSchema
>;

/* --- Appointment events (audit trail) --- */
export const AppointmentEventSchema = z.object({
  id: uuid,
  appointmentId: uuid,
  actorUserId: uuid,
  eventType: AppointmentEventTypeSchema,
  payload: jsonValue.nullable(),
  createdAt: isoDateTime,
});
export type AppointmentEvent = z.infer<typeof AppointmentEventSchema>;
