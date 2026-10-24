import { quoteQuerySchema } from "@homelabconnect/shared";
import type { QuoteBooking } from "../../../application/appointments/QuoteBooking.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentQuote } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class QuoteBookingController implements Controller {
  constructor(private readonly quoteBooking: QuoteBooking) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { procedureIds } = parseRequest(quoteQuerySchema, request.query);
    return presentQuote(await this.quoteBooking.execute({ procedureIds }));
  }
}
