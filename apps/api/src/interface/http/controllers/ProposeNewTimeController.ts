import { appointmentIdParamsSchema, proposeTimeRequestSchema } from "@homelabconnect/shared";
import type { ProposeNewTime } from "../../../application/appointments/ProposeNewTime.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ProposeNewTimeController implements Controller {
  constructor(private readonly proposeNewTime: ProposeNewTime) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const body = parseRequest(proposeTimeRequestSchema, request.body);
    const output = await this.proposeNewTime.execute({
      ...body,
      id,
      actorId: requireAuth(request).userId,
    });
    return presentAppointment(output);
  }
}
