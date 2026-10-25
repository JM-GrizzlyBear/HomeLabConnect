import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { ListAppointmentNotes } from "../../../application/appointments/AppointmentNotes.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";
import { presentNotes } from "../presenters/appointmentPresenter.js";

/** Patients get the notes shared with them; staff and the visit's team need notes.view. */
export class ListAppointmentNotesController implements Controller {
  constructor(private readonly listNotes: ListAppointmentNotes) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { userId, role, permissions } = requireAuth(request);
    return presentNotes(
      await this.listNotes.execute({
        id,
        viewer: {
          userId,
          canViewAll: permissions.has("appointments.view_all"),
          canViewAssigned: permissions.has("visits.view_assigned"),
          canViewNotes: permissions.has("notes.view"),
          canAttach: permissions.has("notes.attach"),
          isAdmin: role === "admin",
        },
      }),
    );
  }
}
