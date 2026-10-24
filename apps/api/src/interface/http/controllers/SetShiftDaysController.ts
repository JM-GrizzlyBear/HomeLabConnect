import { shiftDaysRequestSchema, shiftUserParamsSchema } from "@homelabconnect/shared";
import type { SetShiftDays } from "../../../application/scheduling/SetShiftDays.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentChangedDays } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SetShiftDaysController implements Controller {
  constructor(private readonly setShiftDays: SetShiftDays) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { userId } = parseRequest(shiftUserParamsSchema, request.params);
    const { dates, hours } = parseRequest(shiftDaysRequestSchema, request.body);
    return presentChangedDays(await this.setShiftDays.execute({ userId, dates, hours }));
  }
}
