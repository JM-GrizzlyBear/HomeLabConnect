import { z } from "zod";

export const reportKindSchema = z.enum(["revenue", "bookings", "tests"]);
export const reportPeriodSchema = z.enum(["day", "week", "month"]);
/** Relative ranges a saved report keeps (so "This month" is always this month). */
export const reportPresetSchema = z.enum(["this_month", "last_month", "last_30_days", "this_year"]);

export const reportQuerySchema = z.object({
  from: z.iso.date("Pick a start date."),
  to: z.iso.date("Pick an end date."),
  period: reportPeriodSchema.default("day"),
});

export const reportKindParamsSchema = z.object({ kind: reportKindSchema });

const rangeSchema = z.object({ from: z.iso.date(), to: z.iso.date() });

const revenueRowSchema = z.object({
  period: z.iso.date(),
  card: z.number().int(),
  cash: z.number().int(),
  refunded: z.number().int(),
  kept: z.number().int(),
  payments: z.number().int(),
});

const bookingsRowSchema = z.object({
  period: z.iso.date(),
  booked: z.number().int(),
  confirmed: z.number().int(),
  rejected: z.number().int(),
  cancelled: z.number().int(),
  collected: z.number().int(),
  notCollected: z.number().int(),
  returnVisits: z.number().int(),
  collectionRate: z.number().int(),
});

const testTotalsSchema = z.object({
  ordered: z.number().int(),
  collected: z.number().int(),
  revenueCentavos: z.number().int(),
});

/** One report's figures; money is in centavos. */
export const reportSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("revenue"),
    range: rangeSchema,
    period: reportPeriodSchema,
    rows: z.array(revenueRowSchema),
    totals: revenueRowSchema.omit({ period: true }),
    discounts: z.array(
      z.object({ promotion: z.string(), centavos: z.number().int(), tests: z.number().int() }),
    ),
  }),
  z.object({
    kind: z.literal("bookings"),
    range: rangeSchema,
    period: reportPeriodSchema,
    rows: z.array(bookingsRowSchema),
    totals: bookingsRowSchema.omit({ period: true }),
    topReasons: z.array(z.object({ reason: z.string(), count: z.number().int() })),
  }),
  z.object({
    kind: z.literal("tests"),
    range: rangeSchema,
    rows: z.array(
      testTotalsSchema.extend({ code: z.string(), name: z.string(), category: z.string() }),
    ),
    totals: testTotalsSchema,
    categories: z.array(testTotalsSchema.extend({ category: z.string() })),
  }),
]);

export const savedReportSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  kind: reportKindSchema,
  period: reportPeriodSchema,
  preset: reportPresetSchema.nullable(),
  from: z.iso.date().nullable(),
  to: z.iso.date().nullable(),
  createdAt: z.iso.datetime(),
});
export const savedReportsSchema = z.array(savedReportSchema);

export const saveReportRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the report a name.")
    .max(80, "Keep the name under 80 characters."),
  kind: reportKindSchema,
  period: reportPeriodSchema,
  preset: reportPresetSchema.nullable(),
  from: z.iso.date().nullable(),
  to: z.iso.date().nullable(),
});

export const savedReportIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

export type ReportKind = z.infer<typeof reportKindSchema>;
export type ReportPeriod = z.infer<typeof reportPeriodSchema>;
export type ReportPreset = z.infer<typeof reportPresetSchema>;
export type Report = z.infer<typeof reportSchema>;
export type SavedReportView = z.infer<typeof savedReportSchema>;
export type SaveReportRequest = z.infer<typeof saveReportRequestSchema>;
