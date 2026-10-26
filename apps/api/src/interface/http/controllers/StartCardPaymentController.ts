import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { StartCardPayment } from "../../../application/payments/StartCardPayment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentCheckout } from "../presenters/paymentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** The patient's own visit only: the use case answers 404 for anyone else's. */
export class StartCardPaymentController implements Controller {
  constructor(private readonly startCardPayment: StartCardPayment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { url } = await this.startCardPayment.execute({
      appointmentId: id,
      patientId: requireAuth(request).userId,
    });
    return presentCheckout(url);
  }
}
