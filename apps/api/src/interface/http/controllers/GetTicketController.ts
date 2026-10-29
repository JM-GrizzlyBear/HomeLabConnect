import { ticketIdParamsSchema } from "@homelabconnect/shared";
import type { GetTicket } from "../../../application/support/ReadTickets.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentTicket } from "../presenters/supportPresenter.js";
import { parseRequest } from "../requestValidation.js";
import { ticketViewer } from "./ticketViewer.js";

/** Its patient, its agent, or anyone who sees the queue (404 otherwise). */
export class GetTicketController implements Controller {
  constructor(private readonly getTicket: GetTicket) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(ticketIdParamsSchema, request.params);
    return presentTicket(await this.getTicket.execute(id, ticketViewer(request)));
  }
}
