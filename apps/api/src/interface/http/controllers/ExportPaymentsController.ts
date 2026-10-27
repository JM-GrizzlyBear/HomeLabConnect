import { paymentFiltersSchema } from "@homelabconnect/shared";
import type { ExportPayments } from "../../../application/payments/ListPayments.js";
import type { Clock } from "../../../application/ports/Clock.js";
import { businessDate } from "../../../domain/time/businessDate.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentPaymentsCsv } from "../presenters/paymentPresenter.js";
import { parseRequest } from "../requestValidation.js";
import { toPaymentFilters } from "./ListPaymentsController.js";

/** The same filters as the list, as a CSV download. */
export class ExportPaymentsController implements Controller {
  constructor(
    private readonly exportPayments: ExportPayments,
    private readonly clock: Clock,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(paymentFiltersSchema, request.query);
    const payments = await this.exportPayments.execute(toPaymentFilters(query));
    return presentPaymentsCsv(payments, businessDate(this.clock.now()));
  }
}
