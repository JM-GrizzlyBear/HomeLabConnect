import { catalogIdParamsSchema } from "@homelabconnect/shared";
import type { DeleteProcedureCategory } from "../../../application/catalog/DeleteProcedureCategory.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentNoContent } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class DeleteProcedureCategoryController implements Controller {
  constructor(private readonly deleteProcedureCategory: DeleteProcedureCategory) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    await this.deleteProcedureCategory.execute({ id });
    return presentNoContent();
  }
}
