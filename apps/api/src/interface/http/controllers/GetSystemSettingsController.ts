import type { GetSystemSettings } from "../../../application/settings/GetSystemSettings.js";
import type { Controller, HttpResponse } from "../httpTypes.js";
import { presentSettings } from "../presenters/settingsPresenter.js";

export class GetSystemSettingsController implements Controller {
  constructor(private readonly getSystemSettings: GetSystemSettings) {}

  async handle(): Promise<HttpResponse> {
    return presentSettings(await this.getSystemSettings.execute());
  }
}
