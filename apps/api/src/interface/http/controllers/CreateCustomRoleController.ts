import { createCustomRoleRequestSchema } from "@homelabconnect/shared";
import type { CreateCustomRole } from "../../../application/access/CreateCustomRole.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentCustomRole } from "../presenters/rolePresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreateCustomRoleController implements Controller {
  constructor(private readonly createCustomRole: CreateCustomRole) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(createCustomRoleRequestSchema, request.body);
    return presentCustomRole(await this.createCustomRole.execute(body), 201);
  }
}
