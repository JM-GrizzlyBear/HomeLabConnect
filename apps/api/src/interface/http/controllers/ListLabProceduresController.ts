import { listLabProceduresQuerySchema } from "@homelabconnect/shared";
import type { ListLabProcedures } from "../../../application/catalog/ListLabProcedures.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentProcedureList } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListLabProceduresController implements Controller {
  constructor(private readonly listLabProcedures: ListLabProcedures) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(listLabProceduresQuerySchema, request.query);
    const output = await this.listLabProcedures.execute({
      search: query.q ?? null,
      categoryId: query.categoryId ?? null,
      isActive: query.status === undefined ? null : query.status === "active",
      includeInactive: requireAuth(request).permissions.has("procedures.manage"),
      page: query.page,
      pageSize: query.pageSize,
    });
    return presentProcedureList(output);
  }
}
