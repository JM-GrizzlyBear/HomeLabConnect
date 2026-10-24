import { periodParamsSchema } from "@homelabconnect/shared";
import type { CopyPreviousRosters } from "../../../application/scheduling/CopyPreviousRosters.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentCopiedRosters } from "../presenters/schedulingPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CopyPreviousRostersController implements Controller {
  constructor(private readonly copyPreviousRosters: CopyPreviousRosters) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { periodStart } = parseRequest(periodParamsSchema, request.params);
    return presentCopiedRosters(await this.copyPreviousRosters.execute({ periodStart }));
  }
}
