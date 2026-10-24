import { leaveIdParamsSchema } from "@homelabconnect/shared";
import type { CancelLeave } from "../../../application/scheduling/CancelLeave.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentLeave } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CancelLeaveController implements Controller {
  constructor(private readonly cancelLeave: CancelLeave) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(leaveIdParamsSchema, request.params);
    return presentLeave(
      await this.cancelLeave.execute({ id, userId: requireAuth(request).userId }),
    );
  }
}
