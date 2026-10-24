import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { GetAppointment } from "../../../application/appointments/GetAppointment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Patients see their own; staff with appointments.view_all see any. */
export class GetAppointmentController implements Controller {
  constructor(private readonly getAppointment: GetAppointment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { userId, permissions } = requireAuth(request);
    const output = await this.getAppointment.execute({
      id,
      viewer: { userId, canViewAll: permissions.has("appointments.view_all") },
    });
    return presentAppointment(output);
  }
}
