import { z } from "zod";

/** The groups the audit log is filtered by. */
export const auditGroupSchema = z.enum([
  "sign_ins",
  "failed_sign_ins",
  "users",
  "settings",
  "catalog",
  "scheduling",
  "payments",
]);

export const auditEntrySchema = z.object({
  id: z.uuid(),
  at: z.iso.datetime(),
  actor: z.object({ id: z.uuid(), name: z.string(), email: z.string() }).nullable(),
  /** "<area>.<verb>", e.g. "auth.login_failed". */
  action: z.string(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  summary: z.string().nullable(),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
});

export const auditLogSchema = z.object({
  items: z.array(auditEntrySchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const auditQuerySchema = z.object({
  group: auditGroupSchema.optional(),
  q: z.string().trim().max(100).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuditGroup = z.infer<typeof auditGroupSchema>;
export type AuditEntryView = z.infer<typeof auditEntrySchema>;
export type AuditLogPage = z.infer<typeof auditLogSchema>;
