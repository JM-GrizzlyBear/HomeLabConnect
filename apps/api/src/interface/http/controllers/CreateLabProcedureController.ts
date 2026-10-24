import { labProcedureRequestSchema } from "@homelabconnect/shared";
import type { CreateLabProcedure } from "../../../application/use-cases/createLabProcedure.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentProcedure } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreateLabProcedureController implements Controller {
  constructor(private readonly createLabProcedure: CreateLabProcedure) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(labProcedureRequestSchema, request.body);
    return presentProcedure(await this.createLabProcedure.execute(body), 201);
  }
}
