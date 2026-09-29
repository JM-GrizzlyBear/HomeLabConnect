import type { CheckSystemHealth } from "../../../application/use-cases/CheckSystemHealth.js";
import type { Controller, HttpResponse } from "../HttpTypes.js";
import { presentHealth } from "../presenters/HealthPresenter.js";

export class HealthController implements Controller {
  constructor(private readonly checkSystemHealth: CheckSystemHealth) {}

  async handle(): Promise<HttpResponse> {
    const output = await this.checkSystemHealth.execute();
    return presentHealth(output);
  }
}
