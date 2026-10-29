import { type Dashboard, dashboardSchema } from "@homelabconnect/shared";
import { apiRequest } from "./apiClient";

/** The signed-in user's own dashboard, by their role. */
export async function fetchDashboard(signal?: AbortSignal): Promise<Dashboard> {
  return dashboardSchema.parse(await apiRequest("/dashboard", { signal }));
}
