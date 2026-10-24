import { leaveDecisionRequestSchema, leaveIdParamsSchema } from "@homelabconnect/shared";
import type { DecideLeave } from "../../../application/scheduling/DecideLeave.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentLeave } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Open to any signed-in user: the domain refuses anyone who can't decide the waiting step. */
export class DecideLeaveController implements Controller {
  constructor(private readonly decideLeave: DecideLeave) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(leaveIdParamsSchema, request.params);
    const { decision, note } = parseRequest(leaveDecisionRequestSchema, request.body);
    const { userId, role, permissions } = requireAuth(request);
    const view = await this.decideLeave.execute({
      id,
      approver: { id: userId, role, permissions },
      decision,
      note,
    });
    return presentLeave(view);
  }
}
