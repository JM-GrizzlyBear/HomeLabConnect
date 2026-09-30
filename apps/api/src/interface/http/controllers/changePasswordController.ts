import { changePasswordRequestSchema } from "@homelabconnect/shared";
import type { ChangePassword } from "../../../application/use-cases/changePassword.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentSessionUser } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ChangePasswordController implements Controller {
  constructor(private readonly changePassword: ChangePassword) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(changePasswordRequestSchema, request.body);
    const { userId, sessionId } = requireAuth(request);
    const output = await this.changePassword.execute({ ...body, userId, sessionId });
    return presentSessionUser(output);
  }
}
