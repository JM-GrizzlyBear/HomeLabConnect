import { roleIdParamsSchema } from "@homelabconnect/shared";
import type { GetCustomRole } from "../../../application/use-cases/getCustomRole.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentCustomRole } from "../presenters/rolePresenter.js";
import { parseRequest } from "../requestValidation.js";

export class GetCustomRoleController implements Controller {
  constructor(private readonly getCustomRole: GetCustomRole) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(roleIdParamsSchema, request.params);
    return presentCustomRole(await this.getCustomRole.execute({ id }));
  }
}
