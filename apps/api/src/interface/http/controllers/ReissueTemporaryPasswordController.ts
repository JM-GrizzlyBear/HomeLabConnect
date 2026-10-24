import { userIdParamsSchema } from "@homelabconnect/shared";
import type { ReissueTemporaryPassword } from "../../../application/identity/ReissueTemporaryPassword.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentTemporaryPassword } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ReissueTemporaryPasswordController implements Controller {
  constructor(private readonly reissueTemporaryPassword: ReissueTemporaryPassword) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(userIdParamsSchema, request.params);
    const output = await this.reissueTemporaryPassword.execute({ userId: id });
    return presentTemporaryPassword(output);
  }
}
