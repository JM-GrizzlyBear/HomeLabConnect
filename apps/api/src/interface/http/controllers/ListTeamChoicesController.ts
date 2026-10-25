import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { ListTeamChoices } from "../../../application/appointments/AssignTeam.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentTeamChoices } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListTeamChoicesController implements Controller {
  constructor(private readonly listTeamChoices: ListTeamChoices) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const actorId = requireAuth(request).userId;
    return presentTeamChoices(await this.listTeamChoices.execute({ id, actorId }));
  }
}
