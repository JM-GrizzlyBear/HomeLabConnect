import type { ListLeaveInbox } from "../../../application/scheduling/ListLeaveInbox.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentLeaveList } from "../presenters/schedulingPresenter.js";

/** Open to any signed-in user: the domain decides which steps they may act on. */
export class ListLeaveInboxController implements Controller {
  constructor(private readonly listLeaveInbox: ListLeaveInbox) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { userId, role, permissions } = requireAuth(request);
    return presentLeaveList(await this.listLeaveInbox.execute({ id: userId, role, permissions }));
  }
}
