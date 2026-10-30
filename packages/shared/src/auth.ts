import { z } from "zod";

export const baseRoleSchema = z.enum(["patient", "med_team", "doctor", "support", "admin"]);

/** Mirrors the API's password policy so forms can show the same rules. bcrypt reads at most 72 bytes. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const emailSchema = z.email("Enter a valid email address.");

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password.").max(72),
});

// Profile fields, shared by registration and profile editing.
export const firstNameSchema = z.string().trim().min(1, "Enter your first name.").max(100);
export const lastNameSchema = z.string().trim().min(1, "Enter your last name.").max(100);
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 -]{6,19}$/, "Enter a valid mobile number, e.g. 09171234567.");
export const birthDateSchema = z.iso.date("Enter a valid date.");
export const addressSchema = z.string().trim().min(1).max(500, "Address is too long.");

export const registerPatientRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema,
  birthDate: birthDateSchema.optional(),
  address: addressSchema.optional(),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password.").max(72),
  newPassword: passwordSchema,
});

/** "Forgot password?": the email to send a reset link to. */
export const forgotPasswordRequestSchema = z.object({ email: emailSchema });

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(20, "This link isn't complete. Open it from the email again.").max(200),
  newPassword: passwordSchema,
});

/** The reset form: a new password and its confirmation (the token comes from the link). */
export const resetPasswordFormSchema = z
  .object({ newPassword: passwordSchema, confirmPassword: z.string() })
  .refine((form) => form.confirmPassword === form.newPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** The change-password form: the request plus a confirmation that never leaves the browser. */
export const changePasswordFormSchema = changePasswordRequestSchema
  .extend({ confirmPassword: z.string() })
  .refine((form) => form.confirmPassword === form.newPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const currentUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: baseRoleSchema,
  firstName: z.string(),
  lastName: z.string(),
  mustChangePassword: z.boolean(),
  photoUrl: z.string().nullable(),
});

/** The signed-in user plus what they may do. Returned by login, /auth/me and password change. */
export const sessionUserSchema = currentUserSchema.extend({
  /** Effective permission keys (e.g. "users.view"), after roles and overrides. */
  permissions: z.array(z.string()),
});

/** The session itself travels in an httpOnly cookie, so the body only carries the user. */
export const loginResponseSchema = z.object({
  user: sessionUserSchema,
});

export type BaseRole = z.infer<typeof baseRoleSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterPatientRequest = z.infer<typeof registerPatientRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
