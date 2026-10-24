import type { ListMyLeave } from "../../../application/scheduling/ListMyLeave.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentLeaveList } from "../presenters/schedulingPresenter.js";

export class ListMyLeaveController implements Controller {
  constructor(private readonly listMyLeave: ListMyLeave) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return presentLeaveList(
      await this.listMyLeave.execute({ userId: requireAuth(request).userId }),
    );
  }
}
