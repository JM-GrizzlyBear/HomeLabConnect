import { listPaymentsQuerySchema, type PaymentFiltersQuery } from "@homelabconnect/shared";
import type { ListPayments, PaymentFilters } from "../../../application/payments/ListPayments.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentPaymentList } from "../presenters/paymentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** The query's filters, with "not set" as null. */
export function toPaymentFilters(query: PaymentFiltersQuery): PaymentFilters {
  return {
    status: query.status ?? null,
    provider: query.provider ?? null,
    from: query.from ?? null,
    to: query.to ?? null,
    q: query.q ?? null,
    needsRefund: query.needsRefund,
    refundable: query.refundable,
  };
}

export class ListPaymentsController implements Controller {
  constructor(private readonly listPayments: ListPayments) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(listPaymentsQuerySchema, request.query);
    const output = await this.listPayments.execute({
      ...toPaymentFilters(query),
      page: query.page,
      pageSize: query.pageSize,
    });
    return presentPaymentList(output);
  }
}
