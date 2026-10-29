import { testResultParamsSchema } from "@homelabconnect/shared";
import type { DeleteTestResult } from "../../../application/results/DeleteTestResult.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { parseRequest } from "../requestValidation.js";

export class DeleteTestResultController implements Controller {
  constructor(private readonly deleteTestResult: DeleteTestResult) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id, procedureId } = parseRequest(testResultParamsSchema, request.params);
    await this.deleteTestResult.execute(id, procedureId);
    return { status: 204, body: undefined };
  }
}
