import { teamIdParamsSchema, teamStatusRequestSchema } from "@homelabconnect/shared";
import type { SetTeamActive } from "../../../application/use-cases/setTeamActive.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentTeam } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SetTeamActiveController implements Controller {
  constructor(private readonly setTeamActive: SetTeamActive) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(teamIdParamsSchema, request.params);
    const { isActive } = parseRequest(teamStatusRequestSchema, request.body);
    return presentTeam(await this.setTeamActive.execute({ id, isActive }));
  }
}
