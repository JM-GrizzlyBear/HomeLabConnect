import { catalogIdParamsSchema } from "@homelabconnect/shared";
import type { GetLabProcedure } from "../../../application/catalog/GetLabProcedure.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentProcedure } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class GetLabProcedureController implements Controller {
  constructor(private readonly getLabProcedure: GetLabProcedure) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const procedure = await this.getLabProcedure.execute({
      id,
      includeInactive: requireAuth(request).permissions.has("procedures.manage"),
    });
    return presentProcedure(procedure);
  }
}
