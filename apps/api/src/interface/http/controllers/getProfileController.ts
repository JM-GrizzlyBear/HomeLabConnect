import type { GetProfile } from "../../../application/use-cases/getProfile.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentProfile } from "../presenters/profilePresenter.js";

export class GetProfileController implements Controller {
  constructor(private readonly getProfile: GetProfile) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const output = await this.getProfile.execute({ userId: requireAuth(request).userId });
    return presentProfile(output);
  }
}
