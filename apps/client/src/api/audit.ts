import { type AuditGroup, type AuditLogPage, auditLogSchema } from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

export interface AuditFilters {
  group?: AuditGroup;
  q?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export async function fetchAuditLog(
  filters: AuditFilters,
  signal?: AbortSignal,
): Promise<AuditLogPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return auditLogSchema.parse(await apiRequest(`/audit?${params}`, { signal }));
}
