import type { TicketViewer } from "../../../domain/support/ticket.js";
import type { HttpRequest } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";

/** Who is asking about a ticket, from the signed-in user's permissions. */
export function ticketViewer(request: HttpRequest): TicketViewer {
  const { userId, permissions } = requireAuth(request);
  return {
    userId,
    canViewQueue: permissions.has("support.view_queue"),
    canHandle: permissions.has("support.handle"),
    canClose: permissions.has("support.close"),
  };
}
