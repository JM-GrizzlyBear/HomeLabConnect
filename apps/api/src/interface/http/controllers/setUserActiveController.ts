import { setUserStatusRequestSchema, userIdParamsSchema } from "@homelabconnect/shared";
import type { SetUserActive } from "../../../application/use-cases/setUserActive.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentUserSummary } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SetUserActiveController implements Controller {
  constructor(private readonly setUserActive: SetUserActive) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(userIdParamsSchema, request.params);
    const { isActive } = parseRequest(setUserStatusRequestSchema, request.body);
    const output = await this.setUserActive.execute({
      actorId: requireAuth(request).userId,
      userId: id,
      isActive,
    });
    return presentUserSummary(output);
  }
}
