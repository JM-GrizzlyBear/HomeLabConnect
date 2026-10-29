import { ticketIdParamsSchema } from "@homelabconnect/shared";
import type { OpenMessageAttachment } from "../../../application/support/ReadTickets.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentResultFile } from "../presenters/resultPresenter.js";
import { parseRequest } from "../requestValidation.js";
import { ticketViewer } from "./ticketViewer.js";

/** A chat file, for anyone who may see its ticket (404 otherwise). */
export class OpenMessageAttachmentController implements Controller {
  constructor(private readonly openMessageAttachment: OpenMessageAttachment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(ticketIdParamsSchema, request.params);
    return presentResultFile(await this.openMessageAttachment.execute(id, ticketViewer(request)));
  }
}
