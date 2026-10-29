import type { ResultViewer } from "../../../application/results/resultRepositories.js";
import type { HttpRequest } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";

/** Who is asking about results, from the signed-in user's permissions. */
export function resultViewer(request: HttpRequest): ResultViewer {
  const { userId, permissions } = requireAuth(request);
  return {
    userId,
    canViewAll: permissions.has("appointments.view_all"),
    canViewAssigned: permissions.has("visits.view_assigned"),
    canReview: permissions.has("results.review"),
  };
}
