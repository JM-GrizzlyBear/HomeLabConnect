import type { ListMyAppointments } from "../../../application/appointments/ListMyAppointments.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointments } from "../presenters/appointmentPresenter.js";

export class ListMyAppointmentsController implements Controller {
  constructor(private readonly listMyAppointments: ListMyAppointments) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const patientId = requireAuth(request).userId;
    return presentAppointments(await this.listMyAppointments.execute({ patientId }));
  }
}
