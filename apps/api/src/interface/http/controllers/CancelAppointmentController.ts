import { appointmentIdParamsSchema, cancelAppointmentRequestSchema } from "@homelabconnect/shared";
import type { CancelAppointment } from "../../../application/appointments/CancelAppointment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Behind appointments.cancel: patients cancel their own; staff who can view all cancel any. */
export class CancelAppointmentController implements Controller {
  constructor(private readonly cancelAppointment: CancelAppointment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { reason } = parseRequest(cancelAppointmentRequestSchema, request.body ?? {});
    const { userId, permissions } = requireAuth(request);
    const output = await this.cancelAppointment.execute({
      id,
      actor: { userId, canViewAll: permissions.has("appointments.view_all") },
      reason,
    });
    return presentAppointment(output);
  }
}
