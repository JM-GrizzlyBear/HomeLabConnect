import { medTeamRequestSchema } from "@homelabconnect/shared";
import type { CreateTeam } from "../../../application/scheduling/CreateTeam.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentTeam } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreateTeamController implements Controller {
  constructor(private readonly createTeam: CreateTeam) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(medTeamRequestSchema, request.body);
    return presentTeam(await this.createTeam.execute(body), 201);
  }
}
