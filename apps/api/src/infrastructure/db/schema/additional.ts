import {
  boolean,
  date,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  appointmentEventTypeEnum,
  appointmentStatusEnum,
  assignmentRoleEnum,
  chatConversationTypeEnum,
  dayOfWeekEnum,
  labProcedureCategoryEnum,
  notificationTypeEnum,
  permissionCategoryEnum,
  rescheduleStatusEnum,
  resultStatusEnum,
  shiftOverrideTypeEnum,
  userRoleEnum,
} from "./enums";
import { medTeamMembers } from "./med-team-members";
import { patients } from "./patients";
import { users } from "./users";

export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique("doctors_user_id_unique"),
    licenseNumber: varchar("license_number", { length: 120 }).notNull(),
    specialization: varchar("specialization", { length: 160 }).notNull(),
    clinicName: varchar("clinic_name", { length: 160 }),
    clinicAddress: text("clinic_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "doctors_user_id_fk",
    }),
  }),
);

export const supportAgents = pgTable(
  "support_agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique("support_agents_user_id_unique"),
    isOnline: boolean("is_online").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "support_agents_user_id_fk",
    }),
  }),
);

export const admins = pgTable(
  "admins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().unique("admins_user_id_unique"),
    permissions: text("permissions").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "admins_user_id_fk",
    }),
  }),
);

export const medTeamShiftOverrides = pgTable(
  "med_team_shift_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medTeamMemberId: uuid("med_team_member_id").notNull(),
    overrideDate: date("override_date", { mode: "string" }).notNull(),
    overrideType: shiftOverrideTypeEnum("override_type").notNull(),
    shiftStart: time("shift_start"),
    shiftEnd: time("shift_end"),
    reason: varchar("reason", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    memberFk: foreignKey({
      columns: [t.medTeamMemberId],
      foreignColumns: [medTeamMembers.id],
      name: "med_team_shift_overrides_member_fk",
    }),
    uniqueOverride: uniqueIndex(
      "med_team_shift_overrides_member_date_unique",
    ).on(t.medTeamMemberId, t.overrideDate),
  }),
);

export const supportShifts = pgTable(
  "support_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supportAgentId: uuid("support_agent_id").notNull(),
    dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
    shiftStart: time("shift_start").notNull(),
    shiftEnd: time("shift_end").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    effectiveFrom: date("effective_from", { mode: "string" }).notNull(),
    effectiveUntil: date("effective_until", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    agentFk: foreignKey({
      columns: [t.supportAgentId],
      foreignColumns: [supportAgents.id],
      name: "support_shifts_agent_fk",
    }),
    uniqueSchedule: uniqueIndex(
      "support_shifts_agent_day_start_from_unique",
    ).on(t.supportAgentId, t.dayOfWeek, t.shiftStart, t.effectiveFrom),
  }),
);

export const supportShiftOverrides = pgTable(
  "support_shift_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supportAgentId: uuid("support_agent_id").notNull(),
    overrideDate: date("override_date", { mode: "string" }).notNull(),
    overrideType: shiftOverrideTypeEnum("override_type").notNull(),
    shiftStart: time("shift_start"),
    shiftEnd: time("shift_end"),
    reason: varchar("reason", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    agentFk: foreignKey({
      columns: [t.supportAgentId],
      foreignColumns: [supportAgents.id],
      name: "support_shift_overrides_agent_fk",
    }),
    uniqueOverride: uniqueIndex("support_shift_overrides_agent_date_unique").on(
      t.supportAgentId,
      t.overrideDate,
    ),
  }),
);

export const labProcedures = pgTable(
  "lab_procedures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    category: labProcedureCategoryEnum("category").notNull(),
    description: text("description"),
    preparationInstructions: text("preparation_instructions"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
    price: integer("price").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({ codeUnique: uniqueIndex("lab_procedures_code_unique").on(t.code) }),
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").notNull(),
    doctorId: uuid("doctor_id"),
    requestedDate: timestamp("requested_date", {
      withTimezone: true,
    }).notNull(),
    confirmedDate: timestamp("confirmed_date", { withTimezone: true }),
    status: appointmentStatusEnum("status").notNull().default("pending"),
    serviceAddress: text("service_address").notNull(),
    patientNotes: text("patient_notes"),
    medteamNotes: text("medteam_notes"),
    rejectionReason: text("rejection_reason"),
    totalPrice: integer("total_price").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    patientFk: foreignKey({
      columns: [t.patientId],
      foreignColumns: [patients.id],
      name: "appointments_patient_fk",
    }),
    doctorFk: foreignKey({
      columns: [t.doctorId],
      foreignColumns: [doctors.id],
      name: "appointments_doctor_fk",
    }),
  }),
);

export const appointmentProcedures = pgTable(
  "appointment_procedures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").notNull(),
    procedureId: uuid("procedure_id").notNull(),
    priceAtBooking: integer("price_at_booking").notNull(),
    resultStatus: resultStatusEnum("result_status")
      .notNull()
      .default("pending"),
    resultUrl: text("result_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    appointmentFk: foreignKey({
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
      name: "appointment_procedures_appointment_fk",
    }),
    procedureFk: foreignKey({
      columns: [t.procedureId],
      foreignColumns: [labProcedures.id],
      name: "appointment_procedures_procedure_fk",
    }),
    uniqueProcedure: uniqueIndex(
      "appointment_procedures_appointment_procedure_unique",
    ).on(t.appointmentId, t.procedureId),
  }),
);

export const appointmentAssignments = pgTable(
  "appointment_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").notNull(),
    medTeamMemberId: uuid("med_team_member_id").notNull(),
    role: assignmentRoleEnum("role").notNull().default("lead"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    appointmentFk: foreignKey({
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
      name: "appointment_assignments_appointment_fk",
    }),
    memberFk: foreignKey({
      columns: [t.medTeamMemberId],
      foreignColumns: [medTeamMembers.id],
      name: "appointment_assignments_member_fk",
    }),
    uniqueAssignment: uniqueIndex(
      "appointment_assignments_appointment_member_unique",
    ).on(t.appointmentId, t.medTeamMemberId),
  }),
);

export const rescheduleProposals = pgTable(
  "reschedule_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").notNull(),
    proposedByUserId: uuid("proposed_by_user_id").notNull(),
    proposedDate: timestamp("proposed_date", { withTimezone: true }).notNull(),
    reason: text("reason"),
    status: rescheduleStatusEnum("status").notNull().default("pending"),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    appointmentFk: foreignKey({
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
      name: "reschedule_proposals_appointment_fk",
    }),
    userFk: foreignKey({
      columns: [t.proposedByUserId],
      foreignColumns: [users.id],
      name: "reschedule_proposals_user_fk",
    }),
  }),
);

export const appointmentEvents = pgTable(
  "appointment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id").notNull(),
    actorUserId: uuid("actor_user_id").notNull(),
    eventType: appointmentEventTypeEnum("event_type").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    appointmentFk: foreignKey({
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
      name: "appointment_events_appointment_fk",
    }),
    actorFk: foreignKey({
      columns: [t.actorUserId],
      foreignColumns: [users.id],
      name: "appointment_events_actor_fk",
    }),
  }),
);

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: chatConversationTypeEnum("type").notNull(),
    subject: varchar("subject", { length: 200 }),
    appointmentId: uuid("appointment_id"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    isClosed: boolean("is_closed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    appointmentFk: foreignKey({
      columns: [t.appointmentId],
      foreignColumns: [appointments.id],
      name: "chat_conversations_appointment_fk",
    }),
  }),
);

export const chatParticipants = pgTable(
  "chat_participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull(),
    userId: uuid("user_id").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
  },
  (t) => ({
    conversationFk: foreignKey({
      columns: [t.conversationId],
      foreignColumns: [chatConversations.id],
      name: "chat_participants_conversation_fk",
    }),
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "chat_participants_user_fk",
    }),
    uniqueParticipant: uniqueIndex(
      "chat_participants_conversation_user_unique",
    ).on(t.conversationId, t.userId),
  }),
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id").notNull(),
    senderUserId: uuid("sender_user_id").notNull(),
    content: text("content").notNull(),
    attachmentUrl: text("attachment_url"),
    attachmentType: varchar("attachment_type", { length: 80 }),
    isEdited: boolean("is_edited").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    conversationFk: foreignKey({
      columns: [t.conversationId],
      foreignColumns: [chatConversations.id],
      name: "chat_messages_conversation_fk",
    }),
    senderFk: foreignKey({
      columns: [t.senderUserId],
      foreignColumns: [users.id],
      name: "chat_messages_sender_fk",
    }),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    data: jsonb("data"),
    linkUrl: text("link_url"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "notifications_user_fk",
    }),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: varchar("ip_address", { length: 80 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "sessions_user_fk",
    }),
    tokenUnique: uniqueIndex("sessions_token_hash_unique").on(t.tokenHash),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id"),
    action: varchar("action", { length: 120 }).notNull(),
    resourceType: varchar("resource_type", { length: 120 }).notNull(),
    resourceId: varchar("resource_id", { length: 120 }),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    actorFk: foreignKey({
      columns: [t.actorUserId],
      foreignColumns: [users.id],
      name: "audit_logs_actor_fk",
    }),
  }),
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: varchar("key", { length: 160 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    description: text("description"),
    category: permissionCategoryEnum("category").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({ keyUnique: uniqueIndex("permissions_key_unique").on(t.key) }),
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: userRoleEnum("role").notNull(),
    permissionId: uuid("permission_id").notNull(),
    isGranted: boolean("is_granted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    permissionFk: foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
      name: "role_permissions_permission_fk",
    }),
    rolePermissionUnique: uniqueIndex(
      "role_permissions_role_permission_unique",
    ).on(t.role, t.permissionId),
  }),
);

export const userPermissionOverrides = pgTable(
  "user_permission_overrides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    permissionId: uuid("permission_id").notNull(),
    isGranted: boolean("is_granted").notNull(),
    reason: text("reason"),
    grantedByUserId: uuid("granted_by_user_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userFk: foreignKey({
      columns: [t.userId],
      foreignColumns: [users.id],
      name: "user_permission_overrides_user_fk",
    }),
    permissionFk: foreignKey({
      columns: [t.permissionId],
      foreignColumns: [permissions.id],
      name: "user_permission_overrides_permission_fk",
    }),
    grantedByFk: foreignKey({
      columns: [t.grantedByUserId],
      foreignColumns: [users.id],
      name: "user_permission_overrides_granted_by_fk",
    }),
    overrideUnique: uniqueIndex(
      "user_permission_overrides_user_permission_unique",
    ).on(t.userId, t.permissionId),
  }),
);
