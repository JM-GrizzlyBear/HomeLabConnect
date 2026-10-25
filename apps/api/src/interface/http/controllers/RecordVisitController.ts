import { appointmentIdParamsSchema, recordVisitRequestSchema } from "@homelabconnect/shared";
import type { RecordVisit } from "../../../application/appointments/RecordVisit.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentVisit } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Only members of the visit's team: the use case answers 404 for everyone else. */
export class RecordVisitController implements Controller {
  constructor(private readonly recordVisit: RecordVisit) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const record = parseRequest(recordVisitRequestSchema, request.body);
    const userId = requireAuth(request).userId;
    return presentVisit(await this.recordVisit.execute({ ...record, id, userId }));
  }
}
