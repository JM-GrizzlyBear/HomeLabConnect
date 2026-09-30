import { z } from "zod";
import {
  baseRoleSchema,
  currentUserSchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  phoneSchema,
} from "./auth.js";

/** Roles an admin can give a new staff account. Patients sign themselves up. */
export const staffRoleSchema = z.enum(["med_team", "doctor", "support", "admin"], {
  error: "Choose a staff role.",
});

export const createStaffRequestSchema = z.object({
  email: emailSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema.nullable(),
  role: staffRoleSchema,
  hiredOn: z.iso.date("Enter a valid date.").nullable(),
  /** Optional custom role, built on the same base role. Needs roles.assign. */
  customRoleId: z.uuid().nullable().default(null),
});

/**
 * Returned when an admin creates a staff account or issues a new temporary
 * password. `temporaryPassword` is only present when the email could not be
 * sent, so the admin can hand it over in person. It is never shown again.
 */
export const temporaryPasswordResponseSchema = z.object({
  user: currentUserSchema,
  temporaryPasswordExpiresAt: z.iso.datetime(),
  emailSent: z.boolean(),
  temporaryPassword: z.string().optional(),
});

export const userStatusSchema = z.enum(["active", "inactive"]);

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: baseRoleSchema.optional(),
  status: userStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const userSummarySchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: baseRoleSchema,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  /** The custom role on top of the base role, if any. */
  customRole: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  temporaryPasswordExpiresAt: z.iso.datetime().nullable(),
  lastLoginAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const userListSchema = z.object({
  items: z.array(userSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const setUserStatusRequestSchema = z.object({
  isActive: z.boolean(),
});

/** The `:id` in /users/:id/... routes. */
export const userIdParamsSchema = z.object({
  id: z.uuid("Not a valid user id."),
});

export type StaffRole = z.infer<typeof staffRoleSchema>;
export type CreateStaffRequest = z.input<typeof createStaffRequestSchema>;
export type TemporaryPasswordResponse = z.infer<typeof temporaryPasswordResponseSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
export type ListUsersQuery = z.input<typeof listUsersQuerySchema>;
export type UserSummary = z.infer<typeof userSummarySchema>;
export type UserList = z.infer<typeof userListSchema>;
export type SetUserStatusRequest = z.infer<typeof setUserStatusRequestSchema>;
