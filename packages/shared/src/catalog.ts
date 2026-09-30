import { z } from "zod";

/** Highest price a procedure can have: ₱1,000,000.00 in centavos. */
export const MAX_PRICE_CENTAVOS = 100_000_000;

export const specimenSchema = z.enum(["blood", "urine", "stool", "swab", "other"], {
  error: "Choose a specimen.",
});

export const catalogStatusSchema = z.enum(["active", "inactive"]);

/** Short unique code, e.g. "CBC" or "LIPID-PANEL". Stored uppercase. */
export const procedureCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "Enter a code of at least 2 characters.")
  .max(20, "Code is too long.")
  .regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, "Use letters, digits and single dashes only.");

const optionalTextSchema = z.string().trim().max(500, "Keep this under 500 characters.").nullable();

export const labProcedureRequestSchema = z.object({
  code: procedureCodeSchema,
  name: z.string().trim().min(1, "Enter a name.").max(120, "Name is too long."),
  categoryId: z.uuid("Choose a category."),
  priceCentavos: z
    .number("Enter a price.")
    .int("Enter a price in pesos and centavos.")
    .min(1, "Enter a price above ₱0.")
    .max(MAX_PRICE_CENTAVOS, "Price is too high."),
  specimen: specimenSchema,
  turnaroundHours: z
    .number("Enter how long results take.")
    .int("Enter whole hours.")
    .min(1, "Results take at least 1 hour.")
    .max(720, "Results can't take more than 30 days."),
  fastingHours: z
    .number("Enter fasting hours, or 0.")
    .int("Enter whole hours.")
    .min(0, "Enter 0 for no fasting.")
    .max(24, "Fasting can't be more than 24 hours."),
  preparation: optionalTextSchema,
  description: optionalTextSchema,
});

export const procedureCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  procedureCount: z.number().int().nonnegative(),
});

export const procedureCategoryListSchema = z.array(procedureCategorySchema);

export const categoryRequestSchema = z.object({
  name: z.string().trim().min(1, "Enter a category name.").max(60, "Name is too long."),
});

export const labProcedureSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  name: z.string(),
  category: z.object({ id: z.uuid(), name: z.string() }),
  priceCentavos: z.number().int(),
  specimen: specimenSchema,
  turnaroundHours: z.number().int(),
  fastingHours: z.number().int(),
  preparation: z.string().nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const listLabProceduresQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  categoryId: z.uuid().optional(),
  /** Only honoured for people who can manage procedures; everyone else sees active ones. */
  status: catalogStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const labProcedureListSchema = z.object({
  items: z.array(labProcedureSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const setCatalogStatusRequestSchema = z.object({
  isActive: z.boolean(),
});

/** The `:id` in /catalog/... routes. */
export const catalogIdParamsSchema = z.object({
  id: z.uuid("Not a valid id."),
});

export type Specimen = z.infer<typeof specimenSchema>;
export type CatalogStatus = z.infer<typeof catalogStatusSchema>;
export type LabProcedureRequest = z.input<typeof labProcedureRequestSchema>;
export type ProcedureCategory = z.infer<typeof procedureCategorySchema>;
export type CategoryRequest = z.infer<typeof categoryRequestSchema>;
export type LabProcedure = z.infer<typeof labProcedureSchema>;
export type ListLabProceduresQuery = z.input<typeof listLabProceduresQuerySchema>;
export type LabProcedureList = z.infer<typeof labProcedureListSchema>;
