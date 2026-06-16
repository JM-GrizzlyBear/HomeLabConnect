import { z } from "zod";
import { isoDateTime, uuid } from "./primitives";

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
