import { systemSettingsSchema } from "@homelabconnect/shared";
import type { UpdateSystemSettings } from "../../../application/settings/UpdateSystemSettings.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentSettings } from "../presenters/settingsPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class UpdateSystemSettingsController implements Controller {
  constructor(private readonly updateSystemSettings: UpdateSystemSettings) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const settings = parseRequest(systemSettingsSchema, request.body);
    const record = await this.updateSystemSettings.execute({
      actorId: requireAuth(request).userId,
      settings,
    });
    return presentSettings(record);
  }
}
