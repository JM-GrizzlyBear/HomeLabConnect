import { appointmentIdParamsSchema } from "@homelabconnect/shared";
import type { GetAppointmentResults } from "../../../application/results/GetAppointmentResults.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentAppointmentResults } from "../presenters/resultPresenter.js";
import { parseRequest } from "../requestValidation.js";
import { resultViewer } from "./resultViewer.js";

/** Anyone who may open the appointment: the use case decides how much they see. */
export class GetAppointmentResultsController implements Controller {
  constructor(private readonly getAppointmentResults: GetAppointmentResults) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    return presentAppointmentResults(
      await this.getAppointmentResults.execute(id, resultViewer(request)),
    );
  }
}
