import type { HealthResponse } from "@homelabconnect/shared";
import type { CheckSystemHealthOutput } from "../../../application/use-cases/CheckSystemHealth.js";
import type { HttpResponse } from "../HttpTypes.js";

export function presentHealth(output: CheckSystemHealthOutput): HttpResponse<HealthResponse> {
  return {
    status: output.overall === "ok" ? 200 : 503,
    body: { status: output.overall, db: output.database },
  };
}
