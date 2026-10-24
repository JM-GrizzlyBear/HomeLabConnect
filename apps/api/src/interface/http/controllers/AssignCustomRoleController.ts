import { assignCustomRoleRequestSchema, userIdParamsSchema } from "@homelabconnect/shared";
import type { AssignCustomRole } from "../../../application/access/AssignCustomRole.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentUserSummary } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class AssignCustomRoleController implements Controller {
  constructor(private readonly assignCustomRole: AssignCustomRole) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(userIdParamsSchema, request.params);
    const { customRoleId } = parseRequest(assignCustomRoleRequestSchema, request.body);
    const output = await this.assignCustomRole.execute({
      actorId: requireAuth(request).userId,
      userId: id,
      customRoleId,
    });
    return presentUserSummary(output);
  }
}
