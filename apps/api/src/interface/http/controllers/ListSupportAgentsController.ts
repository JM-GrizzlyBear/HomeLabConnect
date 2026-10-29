import type { ListSupportAgents } from "../../../application/support/ReadTickets.js";
import type { Controller, HttpResponse } from "../httpTypes.js";
import { presentAgents } from "../presenters/supportPresenter.js";

export class ListSupportAgentsController implements Controller {
  constructor(private readonly listSupportAgents: ListSupportAgents) {}

  async handle(): Promise<HttpResponse> {
    return presentAgents(await this.listSupportAgents.execute());
  }
}
