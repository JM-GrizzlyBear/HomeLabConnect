import { closedDayRequestSchema } from "@homelabconnect/shared";
import type { AddClosedDay } from "../../../application/settings/AddClosedDay.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentClosedDay } from "../presenters/settingsPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class AddClosedDayController implements Controller {
  constructor(private readonly addClosedDay: AddClosedDay) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(closedDayRequestSchema, request.body);
    const closedDay = await this.addClosedDay.execute({
      ...body,
      actorId: requireAuth(request).userId,
    });
    return presentClosedDay(closedDay, 201);
  }
}
