import { z } from "zod";

/* =====================================================================
 * ENUMS  (single source of truth — used by Zod + TS + Drizzle later)
 * ===================================================================== */

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

/* =====================================================================
 * SHARED PRIMITIVES
 * ===================================================================== */

const uuid = z.string().uuid();
const isoDateTime = z.string(); // ISO 8601 timestamp e.g. "2026-06-17T10:00:00Z"
const isoDate = z.string(); // YYYY-MM-DD
const timeOfDay = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "HH:MM or HH:MM:SS");
const phone = z.string().min(4).max(40);
const moneyMinor = z.number().int().nonnegative(); // integer minor units
const permissionKey = z
  .string()
  .min(1)
  .max(120)
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/,
    "lowercase dot-notation e.g. 'chat.attachment.create'",
  );
const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(jsonValue),
  ]),
);

export const IdInputSchema = z.object({ id: uuid });
export type IdInput = z.infer<typeof IdInputSchema>;

/* =====================================================================
 * AUTH
 * ===================================================================== */

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: RoleSchema,
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  middleName: z.string().max(80).optional().nullable(),
  phone: phone.optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const PublicUserSchema = z.object({
  id: uuid,
  email: z.string().email(),
  role: RoleSchema,
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullable(),
  phone: z.string().nullable(),
  avatar: z.string().url().nullable(),
  isActive: z.boolean(),
  emailVerified: z.boolean(),
  lastLoginAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const AuthResultSchema = z.object({
  user: PublicUserSchema,
  token: z.string(),
});
export type AuthResult = z.infer<typeof AuthResultSchema>;

/* =====================================================================
 * PATIENT
 * ===================================================================== */

export const PatientSchema = z.object({
  id: uuid,
  userId: uuid,
  dateOfBirth: isoDate.nullable(),
  gender: GenderSchema.nullable(),
  address1: z.string().nullable(),
  address2: z.string().nullable(),
  city: z.string().nullable(),
  province: z.string().nullable(),
  postalCode: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  emergencyContactName: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
  medicalNotes: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Patient = z.infer<typeof PatientSchema>;

export const UpsertPatientProfileInputSchema = z.object({
  dateOfBirth: isoDate.optional().nullable(),
  gender: GenderSchema.optional().nullable(),
  address1: z.string().max(255).optional().nullable(),
  address2: z.string().max(255).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  emergencyContactName: z.string().max(160).optional().nullable(),
  emergencyContactPhone: phone.optional().nullable(),
  medicalNotes: z.string().max(5000).optional().nullable(),
});
export type UpsertPatientProfileInput = z.infer<
  typeof UpsertPatientProfileInputSchema
>;

/* =====================================================================
 * MED TEAM MEMBER
 * ===================================================================== */

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

/* =====================================================================
 * DOCTOR
 * ===================================================================== */

export const DoctorSchema = z.object({
  id: uuid,
  userId: uuid,
  licenseNumber: z.string().nullable(),
  specialization: z.string().nullable(),
  clinicName: z.string().nullable(),
  clinicAddress: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Doctor = z.infer<typeof DoctorSchema>;

export const UpsertDoctorProfileInputSchema = z.object({
  licenseNumber: z.string().max(120).optional().nullable(),
  specialization: z.string().max(160).optional().nullable(),
  clinicName: z.string().max(160).optional().nullable(),
  clinicAddress: z.string().max(255).optional().nullable(),
});
export type UpsertDoctorProfileInput = z.infer<
  typeof UpsertDoctorProfileInputSchema
>;

/* =====================================================================
 * SUPPORT AGENT
 * ===================================================================== */

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

/* =====================================================================
 * ADMIN  (legacy coarse flags — kept for now)
 * ===================================================================== */

export const AdminSchema = z.object({
  id: uuid,
  userId: uuid,
  permissions: z.array(z.string()),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Admin = z.infer<typeof AdminSchema>;

export const UpsertAdminProfileInputSchema = z.object({
  permissions: z.array(z.string().min(1).max(80)).optional().default([]),
});
export type UpsertAdminProfileInput = z.infer<
  typeof UpsertAdminProfileInputSchema
>;

/* =====================================================================
 * LAB PROCEDURES
 * ===================================================================== */

export const LabProcedureSchema = z.object({
  id: uuid,
  code: z.string(),
  name: z.string(),
  category: LabProcedureCategorySchema,
  description: z.string().nullable(),
  preparationInstructions: z.string().nullable(),
  estimatedDurationMinutes: z.number().int().positive().nullable(),
  price: moneyMinor,
  isActive: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type LabProcedure = z.infer<typeof LabProcedureSchema>;

export const CreateLabProcedureInputSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  category: LabProcedureCategorySchema,
  description: z.string().max(2000).optional().nullable(),
  preparationInstructions: z.string().max(2000).optional().nullable(),
  estimatedDurationMinutes: z.number().int().positive().optional().nullable(),
  price: moneyMinor,
  isActive: z.boolean().optional().default(true),
});
export type CreateLabProcedureInput = z.infer<
  typeof CreateLabProcedureInputSchema
>;

export const UpdateLabProcedureInputSchema = z.object({
  id: uuid,
  code: z.string().min(1).max(40).optional(),
  name: z.string().min(1).max(160).optional(),
  category: LabProcedureCategorySchema.optional(),
  description: z.string().max(2000).nullable().optional(),
  preparationInstructions: z.string().max(2000).nullable().optional(),
  estimatedDurationMinutes: z.number().int().positive().nullable().optional(),
  price: moneyMinor.optional(),
  isActive: z.boolean().optional(),
});
export type UpdateLabProcedureInput = z.infer<
  typeof UpdateLabProcedureInputSchema
>;

export const ListLabProceduresInputSchema = z.object({
  category: LabProcedureCategorySchema.optional(),
  search: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
export type ListLabProceduresInput = z.infer<
  typeof ListLabProceduresInputSchema
>;

/* =====================================================================
 * APPOINTMENTS
 * ===================================================================== */

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

/* =====================================================================
 * CHAT
 * ===================================================================== */

export const ChatConversationSchema = z.object({
  id: uuid,
  type: ChatConversationTypeSchema,
  subject: z.string().nullable(),
  appointmentId: uuid.nullable(),
  lastMessageAt: isoDateTime.nullable(),
  isClosed: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type ChatConversation = z.infer<typeof ChatConversationSchema>;

export const CreateChatConversationInputSchema = z.object({
  type: ChatConversationTypeSchema,
  subject: z.string().max(200).optional().nullable(),
  appointmentId: uuid.optional().nullable(),
  participantUserIds: z.array(uuid).min(1),
});
export type CreateChatConversationInput = z.infer<
  typeof CreateChatConversationInputSchema
>;

export const ChatParticipantSchema = z.object({
  id: uuid,
  conversationId: uuid,
  userId: uuid,
  joinedAt: isoDateTime,
  lastReadAt: isoDateTime.nullable(),
});
export type ChatParticipant = z.infer<typeof ChatParticipantSchema>;

export const ChatMessageSchema = z.object({
  id: uuid,
  conversationId: uuid,
  senderUserId: uuid,
  content: z.string(),
  attachmentUrl: z.string().url().nullable(),
  attachmentType: z.string().nullable(),
  isEdited: z.boolean(),
  isDeleted: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const SendChatMessageInputSchema = z.object({
  conversationId: uuid,
  content: z.string().min(1).max(4000),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentType: z.string().max(80).optional().nullable(),
});
export type SendChatMessageInput = z.infer<typeof SendChatMessageInputSchema>;

export const ListChatMessagesInputSchema = z.object({
  conversationId: uuid,
  before: isoDateTime.optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});
export type ListChatMessagesInput = z.infer<typeof ListChatMessagesInputSchema>;

export const MarkConversationReadInputSchema = z.object({
  conversationId: uuid,
});
export type MarkConversationReadInput = z.infer<
  typeof MarkConversationReadInputSchema
>;

/* =====================================================================
 * NOTIFICATIONS
 * ===================================================================== */

export const NotificationSchema = z.object({
  id: uuid,
  userId: uuid,
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  data: jsonValue.nullable(),
  linkUrl: z.string().nullable(),
  isRead: z.boolean(),
  readAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type Notification = z.infer<typeof NotificationSchema>;

export const ListNotificationsInputSchema = z.object({
  isRead: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
export type ListNotificationsInput = z.infer<
  typeof ListNotificationsInputSchema
>;

export const MarkNotificationReadInputSchema = z.object({ id: uuid });
export type MarkNotificationReadInput = z.infer<
  typeof MarkNotificationReadInputSchema
>;

/* =====================================================================
 * SESSIONS  (server-side only — usually NOT returned to clients)
 * ===================================================================== */

export const SessionSchema = z.object({
  id: uuid,
  userId: uuid,
  // token_hash intentionally omitted from public DTO
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  expiresAt: isoDateTime,
  revokedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type Session = z.infer<typeof SessionSchema>;

/* =====================================================================
 * AUDIT LOGS  (admin-only)
 * ===================================================================== */

export const AuditLogSchema = z.object({
  id: uuid,
  actorUserId: uuid.nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  metadata: jsonValue.nullable(),
  ipAddress: z.string().nullable(),
  createdAt: isoDateTime,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const ListAuditLogsInputSchema = z.object({
  actorUserId: uuid.optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  fromDate: isoDateTime.optional(),
  toDate: isoDateTime.optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(50),
});
export type ListAuditLogsInput = z.infer<typeof ListAuditLogsInputSchema>;

/* =====================================================================
 * PERMISSIONS  (feature-level access control / UI gating)
 *
 * Effective permission for a user =
 *   user_permission_override.is_granted (if exists and not expired)
 *   ELSE role_permission.is_granted     (default for the user's role)
 *   ELSE false                          (deny by default)
 * ===================================================================== */

/* --- Permission catalog --- */
export const PermissionSchema = z.object({
  id: uuid,
  key: permissionKey,
  label: z.string(),
  description: z.string().nullable(),
  category: PermissionCategorySchema,
  isActive: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Permission = z.infer<typeof PermissionSchema>;

export const CreatePermissionInputSchema = z.object({
  key: permissionKey,
  label: z.string().min(1).max(160),
  description: z.string().max(500).optional().nullable(),
  category: PermissionCategorySchema,
  isActive: z.boolean().optional().default(true),
});
export type CreatePermissionInput = z.infer<typeof CreatePermissionInputSchema>;

export const UpdatePermissionInputSchema = z.object({
  id: uuid,
  label: z.string().min(1).max(160).optional(),
  description: z.string().max(500).nullable().optional(),
  category: PermissionCategorySchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionInputSchema>;

export const ListPermissionsInputSchema = z.object({
  category: PermissionCategorySchema.optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(120).optional(),
});
export type ListPermissionsInput = z.infer<typeof ListPermissionsInputSchema>;

/* --- Role defaults --- */
export const RolePermissionSchema = z.object({
  id: uuid,
  role: RoleSchema,
  permissionId: uuid,
  isGranted: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type RolePermission = z.infer<typeof RolePermissionSchema>;

export const SetRolePermissionInputSchema = z.object({
  role: RoleSchema,
  permissionId: uuid,
  isGranted: z.boolean(),
});
export type SetRolePermissionInput = z.infer<
  typeof SetRolePermissionInputSchema
>;

export const BulkSetRolePermissionsInputSchema = z.object({
  role: RoleSchema,
  permissions: z
    .array(
      z.object({
        permissionId: uuid,
        isGranted: z.boolean(),
      }),
    )
    .min(1),
});
export type BulkSetRolePermissionsInput = z.infer<
  typeof BulkSetRolePermissionsInputSchema
>;

export const ListRolePermissionsInputSchema = z.object({
  role: RoleSchema,
});
export type ListRolePermissionsInput = z.infer<
  typeof ListRolePermissionsInputSchema
>;

/* --- Per-user overrides --- */
export const UserPermissionOverrideSchema = z.object({
  id: uuid,
  userId: uuid,
  permissionId: uuid,
  isGranted: z.boolean(),
  reason: z.string().nullable(),
  grantedByUserId: uuid,
  expiresAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type UserPermissionOverride = z.infer<
  typeof UserPermissionOverrideSchema
>;

export const SetUserPermissionOverrideInputSchema = z.object({
  userId: uuid,
  permissionId: uuid,
  isGranted: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
  expiresAt: isoDateTime.optional().nullable(),
});
export type SetUserPermissionOverrideInput = z.infer<
  typeof SetUserPermissionOverrideInputSchema
>;

export const ClearUserPermissionOverrideInputSchema = z.object({
  userId: uuid,
  permissionId: uuid,
});
export type ClearUserPermissionOverrideInput = z.infer<
  typeof ClearUserPermissionOverrideInputSchema
>;

export const ListUserPermissionOverridesInputSchema = z.object({
  userId: uuid,
});
export type ListUserPermissionOverridesInput = z.infer<
  typeof ListUserPermissionOverridesInputSchema
>;

/* --- Effective permissions (what the frontend consumes after login) --- */
export const EffectivePermissionSchema = z.object({
  key: permissionKey,
  isGranted: z.boolean(),
  source: z.enum(["override", "role", "default_deny"]),
});
export type EffectivePermission = z.infer<typeof EffectivePermissionSchema>;

export const EffectivePermissionMapSchema = z.record(z.boolean());
export type EffectivePermissionMap = z.infer<
  typeof EffectivePermissionMapSchema
>;

export const GetEffectivePermissionsInputSchema = z.object({
  userId: uuid.optional(), // omit = "me"; admin can pass another userId
});
export type GetEffectivePermissionsInput = z.infer<
  typeof GetEffectivePermissionsInputSchema
>;

/* =====================================================================
 * GENERIC PAGINATION RESULT
 * ===================================================================== */

export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
