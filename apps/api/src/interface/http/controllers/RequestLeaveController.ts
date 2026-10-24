import { leaveRequestBodySchema } from "@homelabconnect/shared";
import type { RequestLeave } from "../../../application/scheduling/RequestLeave.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentLeave } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class RequestLeaveController implements Controller {
  constructor(private readonly requestLeave: RequestLeave) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(leaveRequestBodySchema, request.body);
    const view = await this.requestLeave.execute({ ...body, userId: requireAuth(request).userId });
    return presentLeave(view, 201);
  }
}
