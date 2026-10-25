import { routeQuerySchema } from "@homelabconnect/shared";
import type { GetDailyRoute } from "../../../application/appointments/DailyRoute.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";
import { presentVisits } from "../presenters/appointmentPresenter.js";

export class GetDailyRouteController implements Controller {
  constructor(private readonly getDailyRoute: GetDailyRoute) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { teamId, date } = parseRequest(routeQuerySchema, request.query);
    const { userId, permissions } = requireAuth(request);
    return presentVisits(
      await this.getDailyRoute.execute({
        teamId,
        date,
        viewer: { userId, canManage: permissions.has("routes.manage") },
      }),
    );
  }
}
