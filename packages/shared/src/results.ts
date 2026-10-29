import { z } from "zod";
import { paymentStatusSchema } from "./appointments.js";

/** none: nothing to expect yet · pending: with the doctor · locked: ready, unpaid · ready. */
export const resultsStateSchema = z.enum(["none", "pending", "locked", "ready"]);

export const testResultSchema = z.object({
  id: z.uuid(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  comment: z.string().nullable(),
  uploadedBy: z.object({ id: z.uuid(), name: z.string() }),
  uploadedAt: z.iso.datetime(),
  /** Null while it's a draft. */
  releasedAt: z.iso.datetime().nullable(),
  /** Opens the file after an access check (a short-lived link, never a public one). */
  fileUrl: z.string(),
});

export const appointmentResultsSchema = z.object({
  state: resultsStateSchema,
  /** The viewer reviews results: may upload, remove drafts and release. */
  canManage: z.boolean(),
  tests: z.array(
    z.object({
      procedureId: z.uuid(),
      code: z.string(),
      name: z.string(),
      result: testResultSchema.nullable(),
    }),
  ),
});

export const reviewQueueTabSchema = z.enum(["to_upload", "ready_to_release", "released"]);

export const reviewQueueItemSchema = z.object({
  appointmentId: z.uuid(),
  code: z.string(),
  patientName: z.string(),
  date: z.iso.date(),
  slot: z.string(),
  paymentStatus: paymentStatusSchema,
  testsCollected: z.number().int(),
  testsWithResults: z.number().int(),
  releasedAt: z.iso.datetime().nullable(),
});

export const reviewQueueSchema = z.object({
  items: z.array(reviewQueueItemSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const myResultsSchema = z.array(
  reviewQueueItemSchema.extend({ state: z.enum(["locked", "ready"]) }),
);

export const reviewQueueQuerySchema = z.object({
  tab: reviewQueueTabSchema.default("to_upload"),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const testResultParamsSchema = z.object({
  id: z.uuid("Not a valid id."),
  procedureId: z.uuid("Not a valid id."),
});

export const resultIdParamsSchema = z.object({ id: z.uuid("Not a valid id.") });

/** The text fields sent with a result file (multipart form). */
export const uploadResultFieldsSchema = z.object({
  comment: z.string().trim().max(1000, "Keep the comment under 1000 characters.").optional(),
});

export type ResultsState = z.infer<typeof resultsStateSchema>;
export type TestResultView = z.infer<typeof testResultSchema>;
export type AppointmentResults = z.infer<typeof appointmentResultsSchema>;
export type ReviewQueueTab = z.infer<typeof reviewQueueTabSchema>;
export type ReviewQueueItem = z.infer<typeof reviewQueueItemSchema>;
export type ReviewQueue = z.infer<typeof reviewQueueSchema>;
export type MyResult = z.infer<typeof myResultsSchema>[number];
