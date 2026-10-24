import { catalogIdParamsSchema, setCatalogStatusRequestSchema } from "@homelabconnect/shared";
import type { SetLabProcedureActive } from "../../../application/use-cases/setLabProcedureActive.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentProcedure } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SetLabProcedureActiveController implements Controller {
  constructor(private readonly setLabProcedureActive: SetLabProcedureActive) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const { isActive } = parseRequest(setCatalogStatusRequestSchema, request.body);
    return presentProcedure(await this.setLabProcedureActive.execute({ id, isActive }));
  }
}
