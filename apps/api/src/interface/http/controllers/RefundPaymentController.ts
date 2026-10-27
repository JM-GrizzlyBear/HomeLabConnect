import { paymentIdParamsSchema, refundRequestSchema } from "@homelabconnect/shared";
import type { RefundPayment } from "../../../application/payments/RefundPayment.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentPayment } from "../presenters/paymentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class RefundPaymentController implements Controller {
  constructor(private readonly refundPayment: RefundPayment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(paymentIdParamsSchema, request.params);
    const refund = parseRequest(refundRequestSchema, request.body);
    const payment = await this.refundPayment.execute({
      ...refund,
      paymentId: id,
      actorId: requireAuth(request).userId,
    });
    return presentPayment(payment);
  }
}
