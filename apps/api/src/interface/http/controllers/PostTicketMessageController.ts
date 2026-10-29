import { postMessageFieldsSchema, ticketIdParamsSchema } from "@homelabconnect/shared";
import type { PostMessage } from "../../../application/support/PostMessage.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentMessage } from "../presenters/supportPresenter.js";
import { parseRequest } from "../requestValidation.js";
import { ticketViewer } from "./ticketViewer.js";

/** A multipart form: the "message" and an optional "file". */
export class PostTicketMessageController implements Controller {
  constructor(private readonly postMessage: PostMessage) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(ticketIdParamsSchema, request.params);
    const { message } = parseRequest(postMessageFieldsSchema, request.body ?? {});
    const posted = await this.postMessage.execute({
      ticketId: id,
      viewer: ticketViewer(request),
      message,
      file: request.file ? { data: request.file.data, filename: request.file.filename } : null,
    });
    return presentMessage(posted);
  }
}
