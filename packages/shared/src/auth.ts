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
});

export const loginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime(),
  user: currentUserSchema,
});

export type BaseRole = z.infer<typeof baseRoleSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterPatientRequest = z.infer<typeof registerPatientRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
