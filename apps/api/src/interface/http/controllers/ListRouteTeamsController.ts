import { routeTeamsQuerySchema } from "@homelabconnect/shared";
import type { ListRouteTeams } from "../../../application/appointments/DailyRoute.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";
import { presentRouteTeams } from "../presenters/appointmentPresenter.js";

export class ListRouteTeamsController implements Controller {
  constructor(private readonly listRouteTeams: ListRouteTeams) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { date } = parseRequest(routeTeamsQuerySchema, request.query);
    const { userId, permissions } = requireAuth(request);
    return presentRouteTeams(
      await this.listRouteTeams.execute({
        date,
        viewer: { userId, canManage: permissions.has("routes.manage") },
      }),
    );
  }
}
