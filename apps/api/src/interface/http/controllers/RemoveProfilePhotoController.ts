import type { RemoveProfilePhoto } from "../../../application/identity/RemoveProfilePhoto.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentProfilePhoto } from "../presenters/photoPresenter.js";

export class RemoveProfilePhotoController implements Controller {
  constructor(private readonly removeProfilePhoto: RemoveProfilePhoto) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const output = await this.removeProfilePhoto.execute({ userId: requireAuth(request).userId });
    return presentProfilePhoto(output);
  }
}
