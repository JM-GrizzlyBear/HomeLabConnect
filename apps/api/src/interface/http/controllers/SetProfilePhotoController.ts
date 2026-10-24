import type { SetProfilePhoto } from "../../../application/identity/SetProfilePhoto.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentProfilePhoto } from "../presenters/photoPresenter.js";
import { InvalidRequest } from "../requestValidation.js";

export class SetProfilePhotoController implements Controller {
  constructor(private readonly setProfilePhoto: SetProfilePhoto) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { userId } = requireAuth(request);
    if (!request.file) throw new InvalidRequest([{ path: "photo", message: "Choose a photo." }]);
    const output = await this.setProfilePhoto.execute({ userId, data: request.file.data });
    return presentProfilePhoto(output);
  }
}
