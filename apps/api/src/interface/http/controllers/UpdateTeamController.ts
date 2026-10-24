import { medTeamRequestSchema, teamIdParamsSchema } from "@homelabconnect/shared";
import type { UpdateTeam } from "../../../application/use-cases/updateTeam.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentTeam } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdateTeamController implements Controller {
  constructor(private readonly updateTeam: UpdateTeam) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(teamIdParamsSchema, request.params);
    const body = parseRequest(medTeamRequestSchema, request.body);
    return presentTeam(await this.updateTeam.execute({ id, ...body }));
  }
}
