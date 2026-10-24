import { appointmentIdParamsSchema, appointmentReasonRequestSchema } from "@homelabconnect/shared";
import type { DecideAppointment } from "../../../application/appointments/DecideAppointment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** One instance accepts, another rejects (rejecting needs a reason). */
export class DecideAppointmentController implements Controller {
  constructor(
    private readonly decideAppointment: DecideAppointment,
    private readonly decision: "accept" | "reject",
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const reason =
      this.decision === "reject"
        ? parseRequest(appointmentReasonRequestSchema, request.body).reason
        : null;
    const output = await this.decideAppointment.execute({
      id,
      actorId: requireAuth(request).userId,
      decision: this.decision,
      reason,
    });
    return presentAppointment(output);
  }
}
