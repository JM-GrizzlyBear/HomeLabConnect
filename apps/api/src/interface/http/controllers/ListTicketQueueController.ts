import { ticketQueueQuerySchema } from "@homelabconnect/shared";
import type { ListTicketQueue } from "../../../application/support/ReadTickets.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentTickets } from "../presenters/supportPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListTicketQueueController implements Controller {
  constructor(private readonly listTicketQueue: ListTicketQueue) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(ticketQueueQuerySchema, request.query);
    const tickets = await this.listTicketQueue.execute(
      {
        scope: query.scope,
        status: query.status,
        category: query.category ?? null,
        priority: query.priority ?? null,
        q: query.q || null,
      },
      requireAuth(request).userId,
    );
    return presentTickets(tickets);
  }
}
