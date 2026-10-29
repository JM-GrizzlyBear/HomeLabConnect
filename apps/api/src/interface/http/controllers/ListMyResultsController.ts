import type { ListMyResults } from "../../../application/results/ListReviewQueue.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentMyResults } from "../presenters/resultPresenter.js";

export class ListMyResultsController implements Controller {
  constructor(private readonly listMyResults: ListMyResults) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    return presentMyResults(await this.listMyResults.execute(requireAuth(request).userId));
  }
}
