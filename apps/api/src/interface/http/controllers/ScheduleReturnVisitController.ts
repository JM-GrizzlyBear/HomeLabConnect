import { appointmentIdParamsSchema, returnVisitRequestSchema } from "@homelabconnect/shared";
import type { ScheduleReturnVisit } from "../../../application/appointments/ScheduleReturnVisit.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";

/** The visit's med team (visits.schedule_return) or staff with appointments.assign. */
export class ScheduleReturnVisitController implements Controller {
  constructor(private readonly scheduleReturnVisit: ScheduleReturnVisit) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { date, slot } = parseRequest(returnVisitRequestSchema, request.body);
    const { userId, permissions } = requireAuth(request);
    const output = await this.scheduleReturnVisit.execute({
      id,
      date,
      slot,
      actor: {
        userId,
        canViewAll: permissions.has("appointments.view_all"),
        canViewAssigned: permissions.has("visits.schedule_return"),
        canAssign: permissions.has("appointments.assign"),
      },
    });
    return presentAppointment(output, 201);
  }
}
