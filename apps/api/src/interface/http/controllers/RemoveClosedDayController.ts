import { catalogIdParamsSchema } from "@homelabconnect/shared";
import type { RemoveClosedDay } from "../../../application/settings/RemoveClosedDay.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentNoContent } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class RemoveClosedDayController implements Controller {
  constructor(private readonly removeClosedDay: RemoveClosedDay) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    await this.removeClosedDay.execute({ id });
    return presentNoContent();
  }
}
