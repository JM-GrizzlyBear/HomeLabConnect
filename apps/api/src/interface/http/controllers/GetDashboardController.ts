import type { GetDashboard } from "../../../application/dashboard/GetDashboard.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentDashboard } from "../presenters/dashboardPresenter.js";

/** The signed-in user's own dashboard, by their role. */
export class GetDashboardController implements Controller {
  constructor(private readonly getDashboard: GetDashboard) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { userId, role } = requireAuth(request);
    return presentDashboard(await this.getDashboard.execute({ id: userId, role }));
  }
}
