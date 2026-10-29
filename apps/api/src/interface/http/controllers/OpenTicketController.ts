import { openTicketFieldsSchema } from "@homelabconnect/shared";
import type { OpenTicket } from "../../../application/support/OpenTicket.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentNewTicket } from "../presenters/supportPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** A multipart form: subject, category, appointmentId, message and an optional "file". */
export class OpenTicketController implements Controller {
  constructor(private readonly openTicket: OpenTicket) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const fields = parseRequest(openTicketFieldsSchema, request.body ?? {});
    const ticket = await this.openTicket.execute({
      patientId: requireAuth(request).userId,
      subject: fields.subject,
      category: fields.category,
      appointmentId: fields.appointmentId || null,
      message: fields.message,
      file: request.file ? { data: request.file.data, filename: request.file.filename } : null,
    });
    return presentNewTicket(ticket);
  }
}
