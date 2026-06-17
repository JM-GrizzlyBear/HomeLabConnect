import { z } from "zod";
import { RoleSchema } from "./enums";
import { isoDateTime, phone, uuid } from "./primitives";

export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Role is always "patient" for self-registration. Admins create all other roles.
  role: RoleSchema.optional().default("patient"),
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
