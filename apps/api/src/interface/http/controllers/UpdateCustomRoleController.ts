import { roleIdParamsSchema, updateCustomRoleRequestSchema } from "@homelabconnect/shared";
import type { UpdateCustomRole } from "../../../application/access/UpdateCustomRole.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentCustomRole } from "../presenters/rolePresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdateCustomRoleController implements Controller {
  constructor(private readonly updateCustomRole: UpdateCustomRole) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(roleIdParamsSchema, request.params);
    const body = parseRequest(updateCustomRoleRequestSchema, request.body);
    return presentCustomRole(await this.updateCustomRole.execute({ id, ...body }));
  }
}
