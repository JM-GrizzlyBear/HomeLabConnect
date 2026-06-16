import { z } from "zod";
import { GenderSchema } from "./enums";
import { isoDate, isoDateTime, phone, uuid } from "./primitives";

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
