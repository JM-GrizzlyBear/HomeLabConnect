import { availabilityQuerySchema } from "@homelabconnect/shared";
import type { GetAvailability } from "../../../application/appointments/GetAvailability.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentAvailability } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class GetAvailabilityController implements Controller {
  constructor(private readonly getAvailability: GetAvailability) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const range = parseRequest(availabilityQuerySchema, request.query);
    return presentAvailability(await this.getAvailability.execute(range));
  }
}
