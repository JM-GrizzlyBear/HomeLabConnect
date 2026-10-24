import { listPromotionsQuerySchema } from "@homelabconnect/shared";
import type { ListPromotions } from "../../../application/catalog/ListPromotions.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentPromotionList } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class ListPromotionsController implements Controller {
  constructor(private readonly listPromotions: ListPromotions) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const query = parseRequest(listPromotionsQuerySchema, request.query);
    const promotions = await this.listPromotions.execute({
      status: query.status ?? null,
      includeAll: requireAuth(request).permissions.has("promotions.manage"),
    });
    return presentPromotionList(promotions);
  }
}
