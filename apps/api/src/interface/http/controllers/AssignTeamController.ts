import { appointmentIdParamsSchema, assignTeamRequestSchema } from "@homelabconnect/shared";
import type { AssignTeam } from "../../../application/appointments/AssignTeam.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class AssignTeamController implements Controller {
  constructor(private readonly assignTeam: AssignTeam) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { teamId } = parseRequest(assignTeamRequestSchema, request.body);
    const actorId = requireAuth(request).userId;
    return presentAppointment(await this.assignTeam.execute({ id, teamId, actorId }));
  }
}
