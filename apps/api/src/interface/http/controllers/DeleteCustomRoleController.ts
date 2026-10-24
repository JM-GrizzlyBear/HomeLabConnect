import { roleIdParamsSchema } from "@homelabconnect/shared";
import type { DeleteCustomRole } from "../../../application/access/DeleteCustomRole.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentNoContent } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class DeleteCustomRoleController implements Controller {
  constructor(private readonly deleteCustomRole: DeleteCustomRole) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(roleIdParamsSchema, request.params);
    await this.deleteCustomRole.execute({ id });
    return presentNoContent();
  }
}
