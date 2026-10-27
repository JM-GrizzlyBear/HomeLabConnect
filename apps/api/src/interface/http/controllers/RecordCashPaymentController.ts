import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { RecordCashPayment } from "../../../application/payments/RecordCashPayment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentVisit } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** The visit's med team, or staff who see every appointment. */
export class RecordCashPaymentController implements Controller {
  constructor(private readonly recordCashPayment: RecordCashPayment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { userId, permissions } = requireAuth(request);
    const appointment = await this.recordCashPayment.execute({
      appointmentId: id,
      actor: {
        userId,
        canViewAll: permissions.has("appointments.view_all"),
        canViewAssigned: permissions.has("visits.view_assigned"),
      },
    });
    return presentVisit(appointment);
  }
}
