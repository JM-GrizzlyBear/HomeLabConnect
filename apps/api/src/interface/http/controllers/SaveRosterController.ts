import { rosterParamsSchema, rosterRequestSchema } from "@homelabconnect/shared";
import type { SaveRoster } from "../../../application/scheduling/SaveRoster.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentNoContent } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SaveRosterController implements Controller {
  constructor(private readonly saveRoster: SaveRoster) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id, periodStart } = parseRequest(rosterParamsSchema, request.params);
    const body = parseRequest(rosterRequestSchema, request.body);
    await this.saveRoster.execute({ teamId: id, periodStart, ...body });
    return presentNoContent();
  }
}
