import { catalogIdParamsSchema } from "@homelabconnect/shared";
import type { GetPromotion } from "../../../application/catalog/GetPromotion.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentPromotion } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class GetPromotionController implements Controller {
  constructor(private readonly getPromotion: GetPromotion) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const promotion = await this.getPromotion.execute({
      id,
      includeAll: requireAuth(request).permissions.has("promotions.manage"),
    });
    return presentPromotion(promotion);
  }
}
