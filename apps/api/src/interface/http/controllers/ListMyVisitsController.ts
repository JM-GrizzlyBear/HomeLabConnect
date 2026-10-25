import { myVisitsQuerySchema } from "@homelabconnect/shared";
import type { ListMyVisits } from "../../../application/appointments/ListMyVisits.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentVisits } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListMyVisitsController implements Controller {
  constructor(private readonly listMyVisits: ListMyVisits) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { date } = parseRequest(myVisitsQuerySchema, request.query);
    const userId = requireAuth(request).userId;
    return presentVisits(await this.listMyVisits.execute({ userId, date }));
  }
}
