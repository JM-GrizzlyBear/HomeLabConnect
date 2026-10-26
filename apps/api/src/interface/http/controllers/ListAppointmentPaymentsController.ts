import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { ListAppointmentPayments } from "../../../application/payments/ListPayments.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointmentPayments } from "../presenters/paymentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** Anyone who may open the appointment: its patient, its med team, or staff. */
export class ListAppointmentPaymentsController implements Controller {
  constructor(private readonly listAppointmentPayments: ListAppointmentPayments) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { userId, permissions } = requireAuth(request);
    const output = await this.listAppointmentPayments.execute(id, {
      userId,
      canViewAll: permissions.has("appointments.view_all"),
      canViewAssigned: permissions.has("visits.view_assigned"),
    });
    return presentAppointmentPayments(output);
  }
}
