import { saveReportRequestSchema } from "@homelabconnect/shared";
import type { SaveReport } from "../../../application/reports/SavedReports.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentSavedReport } from "../presenters/reportPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SaveReportController implements Controller {
  constructor(private readonly saveReport: SaveReport) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(saveReportRequestSchema, request.body);
    const saved = await this.saveReport.execute({ ...body, userId: requireAuth(request).userId });
    return presentSavedReport(saved);
  }
}
