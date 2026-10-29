import { savedReportIdParamsSchema } from "@homelabconnect/shared";
import type { DeleteSavedReport } from "../../../application/reports/SavedReports.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { parseRequest } from "../requestValidation.js";

/** Only the owner's own reports: anyone else's answers 404. */
export class DeleteSavedReportController implements Controller {
  constructor(private readonly deleteSavedReport: DeleteSavedReport) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(savedReportIdParamsSchema, request.params);
    await this.deleteSavedReport.execute(id, requireAuth(request).userId);
    return { status: 204, body: undefined };
  }
}
