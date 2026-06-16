import { z } from "zod";
import { isoDateTime, uuid } from "./primitives";

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
