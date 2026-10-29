import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { ReleaseResults } from "../../../application/results/ReleaseResults.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";

export class ReleaseResultsController implements Controller {
  constructor(private readonly releaseResults: ReleaseResults) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    await this.releaseResults.execute(id, requireAuth(request).userId);
    return { status: 204, body: undefined };
  }
}
