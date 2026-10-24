import type { GetCurrentUser } from "../../../application/identity/GetCurrentUser.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentSessionUser } from "../presenters/authPresenter.js";

export class GetCurrentUserController implements Controller {
  constructor(private readonly getCurrentUser: GetCurrentUser) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const output = await this.getCurrentUser.execute({ userId: requireAuth(request).userId });
    return presentSessionUser(output);
  }
}
