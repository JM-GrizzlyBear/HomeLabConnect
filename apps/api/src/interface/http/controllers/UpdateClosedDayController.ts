import { catalogIdParamsSchema, closedDayRequestSchema } from "@homelabconnect/shared";
import type { UpdateClosedDay } from "../../../application/use-cases/updateClosedDay.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentClosedDay } from "../presenters/settingsPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdateClosedDayController implements Controller {
  constructor(private readonly updateClosedDay: UpdateClosedDay) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const body = parseRequest(closedDayRequestSchema, request.body);
    return presentClosedDay(await this.updateClosedDay.execute({ id, ...body }));
  }
}
