import { scheduleRangeQuerySchema } from "@homelabconnect/shared";
import type { GetMySchedule } from "../../../application/scheduling/GetMySchedule.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentSchedule } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class GetMyScheduleController implements Controller {
  constructor(private readonly getMySchedule: GetMySchedule) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { from, to } = parseRequest(scheduleRangeQuerySchema, request.query);
    const days = await this.getMySchedule.execute({
      userId: requireAuth(request).userId,
      from,
      to,
    });
    return presentSchedule(days);
  }
}
