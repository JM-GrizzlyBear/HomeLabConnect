import { listClosedDaysQuerySchema } from "@homelabconnect/shared";
import type { ListClosedDays } from "../../../application/use-cases/listClosedDays.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentClosedDayList } from "../presenters/settingsPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListClosedDaysController implements Controller {
  constructor(private readonly listClosedDays: ListClosedDays) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { year } = parseRequest(listClosedDaysQuerySchema, request.query);
    return presentClosedDayList(await this.listClosedDays.execute({ year: year ?? null }));
  }
}
