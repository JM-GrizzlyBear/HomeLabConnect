import { promotionRequestSchema } from "@homelabconnect/shared";
import type { CreatePromotion } from "../../../application/use-cases/createPromotion.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentPromotion } from "../presenters/catalogPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreatePromotionController implements Controller {
  constructor(private readonly createPromotion: CreatePromotion) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(promotionRequestSchema, request.body);
    return presentPromotion(await this.createPromotion.execute(body), 201);
  }
}
