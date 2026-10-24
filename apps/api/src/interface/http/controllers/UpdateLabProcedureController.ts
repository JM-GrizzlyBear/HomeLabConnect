import { catalogIdParamsSchema, labProcedureRequestSchema } from "@homelabconnect/shared";
import type { UpdateLabProcedure } from "../../../application/catalog/UpdateLabProcedure.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentProcedure } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdateLabProcedureController implements Controller {
  constructor(private readonly updateLabProcedure: UpdateLabProcedure) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const body = parseRequest(labProcedureRequestSchema, request.body);
    return presentProcedure(await this.updateLabProcedure.execute({ id, ...body }));
  }
}
