import type { ListMyTickets } from "../../../application/support/ReadTickets.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentTickets } from "../presenters/supportPresenter.js";

export class ListMyTicketsController implements Controller {
  constructor(private readonly listMyTickets: ListMyTickets) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return presentTickets(await this.listMyTickets.execute(requireAuth(request).userId));
  }
}
