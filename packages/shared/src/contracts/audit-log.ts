import { z } from "zod";
import { isoDateTime, jsonValue, uuid } from "./primitives";

export const AuditLogSchema = z.object({
  id: uuid,
  actorUserId: uuid.nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  metadata: jsonValue.nullable(),
  ipAddress: z.string().nullable(),
  createdAt: isoDateTime,
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const ListAuditLogsInputSchema = z.object({
  actorUserId: uuid.optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  fromDate: isoDateTime.optional(),
  toDate: isoDateTime.optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(50),
});
export type ListAuditLogsInput = z.infer<typeof ListAuditLogsInputSchema>;
