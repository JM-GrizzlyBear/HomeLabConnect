import { catalogIdParamsSchema, promotionRequestSchema } from "@homelabconnect/shared";
import type { UpdatePromotion } from "../../../application/catalog/UpdatePromotion.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentPromotion } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdatePromotionController implements Controller {
  constructor(private readonly updatePromotion: UpdatePromotion) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const body = parseRequest(promotionRequestSchema, request.body);
    return presentPromotion(await this.updatePromotion.execute({ id, ...body }));
  }
}
