import { addNoteRequestSchema, appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { AddAppointmentNote } from "../../../application/appointments/AppointmentNotes.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";
import { presentNotes } from "../presenters/appointmentPresenter.js";

/** A multipart form: "body", "sharedWithPatient" and an optional "file" (needs notes.attach). */
export class AddAppointmentNoteController implements Controller {
  constructor(private readonly addNote: AddAppointmentNote) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { body, sharedWithPatient } = parseRequest(addNoteRequestSchema, request.body ?? {});
    const { userId, role, permissions } = requireAuth(request);
    const notes = await this.addNote.execute({
      id,
      viewer: {
        userId,
        canViewAll: permissions.has("appointments.view_all"),
        canViewAssigned: permissions.has("visits.view_assigned"),
        canViewNotes: permissions.has("notes.view"),
        canAttach: permissions.has("notes.attach"),
        isAdmin: role === "admin",
      },
      body,
      sharedWithPatient,
      file: request.file ? { data: request.file.data, filename: request.file.filename } : null,
    });
    return presentNotes(notes, 201);
  }
}
