import type { Logout } from "../../../application/use-cases/logout.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentNoContent } from "../presenters/authPresenter.js";

export class LogoutController implements Controller {
  constructor(private readonly logout: Logout) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    await this.logout.execute({ sessionId: requireAuth(request).sessionId });
    return presentNoContent();
  }
}
