import { resultIdParamsSchema } from "@homelabconnect/shared";
import type { OpenResultFile } from "../../../application/results/OpenResultFile.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentResultFile } from "../presenters/resultPresenter.js";
import { parseRequest } from "../requestValidation.js";
import { resultViewer } from "./resultViewer.js";

/** Doctors, or the patient once released and paid: the use case checks (404 otherwise). */
export class OpenResultFileController implements Controller {
  constructor(private readonly openResultFile: OpenResultFile) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(resultIdParamsSchema, request.params);
    return presentResultFile(await this.openResultFile.execute(id, resultViewer(request)));
  }
}
