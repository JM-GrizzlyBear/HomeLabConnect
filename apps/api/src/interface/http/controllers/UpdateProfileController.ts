import { updateProfileRequestSchema } from "@homelabconnect/shared";
import type { UpdateProfile } from "../../../application/use-cases/updateProfile.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentProfile } from "../presenters/profilePresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdateProfileController implements Controller {
  constructor(private readonly updateProfile: UpdateProfile) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(updateProfileRequestSchema, request.body);
    const output = await this.updateProfile.execute({
      ...body,
      userId: requireAuth(request).userId,
      patient: body.patient ?? null,
    });
    return presentProfile(output);
  }
}
