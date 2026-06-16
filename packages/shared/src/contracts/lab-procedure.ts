import { z } from "zod";
import { LabProcedureCategorySchema } from "./enums";
import { isoDateTime, moneyMinor, uuid } from "./primitives";

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
