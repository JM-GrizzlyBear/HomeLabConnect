import { catalogIdParamsSchema, setCatalogStatusRequestSchema } from "@homelabconnect/shared";
import type { SetPromotionActive } from "../../../application/use-cases/setPromotionActive.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentPromotion } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class SetPromotionActiveController implements Controller {
  constructor(private readonly setPromotionActive: SetPromotionActive) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(catalogIdParamsSchema, request.params);
    const { isActive } = parseRequest(setCatalogStatusRequestSchema, request.body);
    return presentPromotion(await this.setPromotionActive.execute({ id, isActive }));
  }
}
