import type { ListMyPayments } from "../../../application/payments/ListPayments.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentMyPayments } from "../presenters/paymentPresenter.js";

export class ListMyPaymentsController implements Controller {
  constructor(private readonly listMyPayments: ListMyPayments) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return presentMyPayments(await this.listMyPayments.execute(requireAuth(request).userId));
  }
}
