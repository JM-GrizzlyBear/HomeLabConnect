import type { AuditLogPage } from "@homelabconnect/shared";
import type { ListAuditLogOutput } from "../../../application/audit/ListAuditLog.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentAuditLog(output: ListAuditLogOutput): HttpResponse<AuditLogPage> {
  return {
    status: 200,
    body: {
      ...output,
      items: output.items.map((entry) => ({
        id: entry.id,
        at: entry.at.toISOString(),
        actor: entry.actor,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        summary: entry.summary,
        ip: entry.ip,
        userAgent: entry.userAgent,
      })),
    },
  };
}
