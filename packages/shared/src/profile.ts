import { z } from "zod";
import {
  addressSchema,
  baseRoleSchema,
  birthDateSchema,
  firstNameSchema,
  lastNameSchema,
  phoneSchema,
} from "./auth.js";

/** Patient-only details. Null for staff. */
export const patientDetailsSchema = z.object({
  birthDate: z.iso.date().nullable(),
  address: z.string().nullable(),
});

export const profileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  role: baseRoleSchema,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  patient: patientDetailsSchema.nullable(),
});

/**
 * Replaces the editable profile fields. Email and role can't be changed here.
 * `patient` is only accepted for patients; leave it out to keep the stored values.
 */
export const updateProfileRequestSchema = z.object({
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  phone: phoneSchema.nullable(),
  patient: z
    .object({
      birthDate: birthDateSchema.nullable(),
      address: addressSchema.nullable(),
    })
    .optional(),
});

/** The answer to setting or removing a profile photo. */
export const profilePhotoSchema = z.object({
  photoUrl: z.string().nullable(),
});

/** Profile photos: JPG, PNG or WebP, up to 2 MB (checked again by the API). */
export const PROFILE_PHOTO_LIMITS = {
  maxBytes: 2 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"],
} as const;

export type PatientDetails = z.infer<typeof patientDetailsSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type ProfilePhoto = z.infer<typeof profilePhotoSchema>;
