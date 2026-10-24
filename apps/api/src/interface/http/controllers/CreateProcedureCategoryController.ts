import { categoryRequestSchema } from "@homelabconnect/shared";
import type { CreateProcedureCategory } from "../../../application/catalog/CreateProcedureCategory.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentCategory } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreateProcedureCategoryController implements Controller {
  constructor(private readonly createProcedureCategory: CreateProcedureCategory) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(categoryRequestSchema, request.body);
    return presentCategory(await this.createProcedureCategory.execute(body), 201);
  }
}
