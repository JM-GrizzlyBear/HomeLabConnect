import { reportKindParamsSchema, reportQuerySchema } from "@homelabconnect/shared";
import type { RunReport } from "../../../application/reports/RunReport.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentReport, presentReportCsv } from "../presenters/reportPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** A report as JSON, or (with `asCsv`) as a spreadsheet download. */
export class RunReportController implements Controller {
  constructor(
    private readonly runReport: RunReport,
    private readonly asCsv = false,
  ) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { kind } = parseRequest(reportKindParamsSchema, request.params);
    const query = parseRequest(reportQuerySchema, request.query);
    const report = await this.runReport.execute({ kind, ...query });
    return this.asCsv ? presentReportCsv(report) : presentReport(report);
  }
}
