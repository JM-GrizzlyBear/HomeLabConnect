import { catalogIdParamsSchema, categoryRequestSchema } from "@homelabconnect/shared";
import type { RenameProcedureCategory } from "../../../application/catalog/RenameProcedureCategory.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentCategory } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class RenameProcedureCategoryController implements Controller {
  constructor(private readonly renameProcedureCategory: RenameProcedureCategory) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const { name } = parseRequest(categoryRequestSchema, request.body);
    return presentCategory(await this.renameProcedureCategory.execute({ id, name }));
  }
}
