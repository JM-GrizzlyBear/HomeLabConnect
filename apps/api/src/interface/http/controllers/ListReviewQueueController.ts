import { reviewQueueQuerySchema } from "@homelabconnect/shared";
import type { ListReviewQueue } from "../../../application/results/ListReviewQueue.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentReviewQueue } from "../presenters/resultPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListReviewQueueController implements Controller {
  constructor(private readonly listReviewQueue: ListReviewQueue) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(reviewQueueQuerySchema, request.query);
    return presentReviewQueue(await this.listReviewQueue.execute({ ...query, q: query.q ?? null }));
  }
}
