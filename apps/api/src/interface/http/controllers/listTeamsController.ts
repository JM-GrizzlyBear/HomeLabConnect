import { listTeamsQuerySchema } from "@homelabconnect/shared";
import type { ListTeams } from "../../../application/use-cases/listTeams.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentTeamBoard } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListTeamsController implements Controller {
  constructor(private readonly listTeams: ListTeams) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { date } = parseRequest(listTeamsQuerySchema, request.query);
    const board = await this.listTeams.execute({
      date: date ?? null,
      includeInactive: requireAuth(request).permissions.has("teams.manage"),
    });
    return presentTeamBoard(board);
  }
}
