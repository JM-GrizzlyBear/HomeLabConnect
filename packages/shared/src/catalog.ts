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
  /** The running promotion that gives the lowest price today, if any. */
  promotion: z
    .object({ id: z.uuid(), name: z.string(), discountedPriceCentavos: z.number().int() })
    .nullable(),
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

export const discountTypeSchema = z.enum(["percent", "fixed"], {
  error: "Choose a kind of discount.",
});
export const promotionScopeSchema = z.enum(["all", "selected"]);
/** Scheduled (not started), running, ended, or off (switched off by an admin). */
export const promotionStatusSchema = z.enum(["scheduled", "running", "ended", "off"]);

export const promotionRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name.").max(80, "Name is too long."),
    description: z.string().trim().max(300, "Keep this under 300 characters.").nullable(),
    discountType: discountTypeSchema,
    /** Percent (1–100) or centavos off, depending on discountType. */
    value: z
      .number("Enter the discount.")
      .int("Enter a whole number.")
      .min(1, "Enter a discount above 0."),
    /** First and last day of the sale, inclusive, in Philippine time. */
    startsOn: z.iso.date("Choose the first day."),
    /** null: no end date, e.g. a standing senior/PWD discount. It runs until switched off. */
    endsOn: z.iso.date("Choose the last day.").nullable(),
    appliesTo: promotionScopeSchema,
    procedureIds: z.array(z.uuid()),
  })
  .superRefine((promotion, ctx) => {
    if (promotion.discountType === "percent" && promotion.value > 100) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "A percent discount is 1–100." });
    }
    if (promotion.discountType === "fixed" && promotion.value > MAX_PRICE_CENTAVOS) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "The discount is too high." });
    }
    if (promotion.endsOn !== null && promotion.endsOn < promotion.startsOn) {
      ctx.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "The last day can't be before the first.",
      });
    }
    if (promotion.appliesTo === "selected" && promotion.procedureIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["procedureIds"],
        message: "Choose at least one procedure.",
      });
    }
  });

export const promotionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  discountType: discountTypeSchema,
  value: z.number().int(),
  startsOn: z.iso.date(),
  /** null: no end date. */
  endsOn: z.iso.date().nullable(),
  appliesTo: promotionScopeSchema,
  /** Empty when the promotion applies to every procedure. */
  procedureIds: z.array(z.uuid()),
  isActive: z.boolean(),
  status: promotionStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const promotionListSchema = z.array(promotionSchema);

export const listPromotionsQuerySchema = z.object({
  /** Only honoured for people who can manage promotions; everyone else sees running ones. */
  status: promotionStatusSchema.optional(),
});

/**
 * The price after one discount, never below ₱0. The API applies the same rule
 * in its domain; this copy is for previews in the client.
 */
export function discountedPriceCentavos(
  priceCentavos: number,
  discountType: DiscountType,
  value: number,
): number {
  const off = discountType === "percent" ? Math.round((priceCentavos * value) / 100) : value;
  return Math.max(0, priceCentavos - off);
}

export type Specimen = z.infer<typeof specimenSchema>;
export type DiscountType = z.infer<typeof discountTypeSchema>;
export type PromotionScope = z.infer<typeof promotionScopeSchema>;
export type PromotionStatus = z.infer<typeof promotionStatusSchema>;
export type PromotionRequest = z.infer<typeof promotionRequestSchema>;
export type Promotion = z.infer<typeof promotionSchema>;
export type ListPromotionsQuery = z.input<typeof listPromotionsQuerySchema>;
export type CatalogStatus = z.infer<typeof catalogStatusSchema>;
export type LabProcedureRequest = z.input<typeof labProcedureRequestSchema>;
export type ProcedureCategory = z.infer<typeof procedureCategorySchema>;
export type CategoryRequest = z.infer<typeof categoryRequestSchema>;
export type LabProcedure = z.infer<typeof labProcedureSchema>;
export type ListLabProceduresQuery = z.input<typeof listLabProceduresQuerySchema>;
export type LabProcedureList = z.infer<typeof labProcedureListSchema>;
