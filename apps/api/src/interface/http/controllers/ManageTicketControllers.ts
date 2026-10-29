import {
  rateTicketRequestSchema,
  reassignTicketRequestSchema,
  setTicketPriorityRequestSchema,
  ticketIdParamsSchema,
} from "@homelabconnect/shared";
import type {
  ClaimTicket,
  CloseTicket,
  RateTicket,
  ReassignTicket,
  SetTicketPriority,
} from "../../../application/support/ManageTicket.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { parseRequest } from "../requestValidation.js";
import { ticketViewer } from "./ticketViewer.js";

const done: HttpResponse = { status: 204, body: undefined };
const ticketId = (request: HttpRequest) => parseRequest(ticketIdParamsSchema, request.params).id;

export class ClaimTicketController implements Controller {
  constructor(private readonly claimTicket: ClaimTicket) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    await this.claimTicket.execute(ticketId(request), ticketViewer(request));
    return done;
  }
}

export class ReassignTicketController implements Controller {
  constructor(private readonly reassignTicket: ReassignTicket) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { assigneeId } = parseRequest(reassignTicketRequestSchema, request.body);
    await this.reassignTicket.execute(ticketId(request), assigneeId, ticketViewer(request));
    return done;
  }
}

export class SetTicketPriorityController implements Controller {
  constructor(private readonly setTicketPriority: SetTicketPriority) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { priority } = parseRequest(setTicketPriorityRequestSchema, request.body);
    await this.setTicketPriority.execute(ticketId(request), priority, ticketViewer(request));
    return done;
  }
}

/** Support with support.close, or the ticket's patient. */
export class CloseTicketController implements Controller {
  constructor(private readonly closeTicket: CloseTicket) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    await this.closeTicket.execute(ticketId(request), ticketViewer(request));
    return done;
  }
}

/** The ticket's patient, once it's closed. */
export class RateTicketController implements Controller {
  constructor(private readonly rateTicket: RateTicket) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const rating = parseRequest(rateTicketRequestSchema, request.body);
    await this.rateTicket.execute(ticketId(request), rating, ticketViewer(request));
    return done;
  }
}
