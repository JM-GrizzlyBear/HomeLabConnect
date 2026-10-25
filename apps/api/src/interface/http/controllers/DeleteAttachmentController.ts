import { attachmentParamsSchema } from "@homelabconnect/shared";
import type { DeleteAttachment } from "../../../application/appointments/AppointmentNotes.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";

/** Whoever uploaded the file, or an admin. */
export class DeleteAttachmentController implements Controller {
  constructor(private readonly deleteAttachment: DeleteAttachment) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id, attachmentId } = parseRequest(attachmentParamsSchema, request.params);
    const { userId, role, permissions } = requireAuth(request);
    await this.deleteAttachment.execute({
      id,
      attachmentId,
      viewer: {
        userId,
        canViewAll: permissions.has("appointments.view_all"),
        canViewAssigned: permissions.has("visits.view_assigned"),
        canViewNotes: permissions.has("notes.view"),
        canAttach: permissions.has("notes.attach"),
        isAdmin: role === "admin",
      },
    });
    return { status: 204, body: undefined };
  }
}
