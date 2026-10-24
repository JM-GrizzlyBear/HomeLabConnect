import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentLogout } from "../presenters/authPresenter.js";

export class LogoutController implements Controller {
  async handle(request: HttpRequest): Promise<HttpResponse> {
    requireAuth(request);
    return presentLogout();
  }
}
