import { auditQuerySchema } from "@homelabconnect/shared";
import type { ListAuditLog } from "../../../application/audit/ListAuditLog.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentAuditLog } from "../presenters/auditPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListAuditLogController implements Controller {
  constructor(private readonly listAuditLog: ListAuditLog) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(auditQuerySchema, request.query);
    const output = await this.listAuditLog.execute({
      group: query.group ?? null,
      q: query.q ?? null,
      from: query.from ?? null,
      to: query.to ?? null,
      page: query.page,
      pageSize: query.pageSize,
    });
    return presentAuditLog(output);
  }
}
