import { listAppointmentsQuerySchema } from "@homelabconnect/shared";
import type { ListAppointments } from "../../../application/appointments/ListAppointments.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentAppointmentList } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListAppointmentsController implements Controller {
  constructor(private readonly listAppointments: ListAppointments) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(listAppointmentsQuerySchema, request.query);
    const output = await this.listAppointments.execute({
      status: query.status ?? null,
      from: query.from ?? null,
      to: query.to ?? null,
      q: query.q ?? null,
      page: query.page,
      pageSize: query.pageSize,
    });
    return presentAppointmentList(output);
  }
}
