import type { AuditEntry, AuditLog, AuditQuery } from "../../domain/audit/auditEntry.js";

export interface ListAuditLogOutput {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

/** Admins: the audit log, newest first, filtered and paged. */
export class ListAuditLog {
  constructor(private readonly log: AuditLog) {}

  async execute(query: AuditQuery): Promise<ListAuditLogOutput> {
    const result = await this.log.list({ ...query, q: query.q?.trim() || null });
    return { ...result, page: query.page, pageSize: query.pageSize };
  }
}
