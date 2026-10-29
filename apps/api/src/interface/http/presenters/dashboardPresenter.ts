import type { Dashboard } from "@homelabconnect/shared";
import type { DashboardOutput } from "../../../application/dashboard/GetDashboard.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentDashboard(output: DashboardOutput): HttpResponse<Dashboard> {
  return { status: 200, body: output };
}
