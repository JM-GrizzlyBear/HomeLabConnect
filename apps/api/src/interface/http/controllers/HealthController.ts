import type { CheckSystemHealth } from "../../../application/health/CheckSystemHealth.js";
import type { Controller, HttpResponse } from "../httpTypes.js";
import { presentHealth } from "../presenters/healthPresenter.js";

export class HealthController implements Controller {
  constructor(private readonly checkSystemHealth: CheckSystemHealth) {}

  async handle(): Promise<HttpResponse> {
    const output = await this.checkSystemHealth.execute();
    return presentHealth(output);
  }
}
