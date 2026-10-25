import { reorderRouteRequestSchema } from "@homelabconnect/shared";
import type { ReorderRoute } from "../../../application/appointments/DailyRoute.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";
import { presentVisits } from "../presenters/appointmentPresenter.js";

export class ReorderRouteController implements Controller {
  constructor(private readonly reorderRoute: ReorderRoute) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    requireAuth(request);
    const input = parseRequest(reorderRouteRequestSchema, request.body);
    return presentVisits(await this.reorderRoute.execute(input));
  }
}
