import type { ListSavedReports } from "../../../application/reports/SavedReports.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentSavedReports } from "../presenters/reportPresenter.js";

export class ListSavedReportsController implements Controller {
  constructor(private readonly listSavedReports: ListSavedReports) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return presentSavedReports(await this.listSavedReports.execute(requireAuth(request).userId));
  }
}
