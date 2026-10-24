import { appointmentIdParamsSchema, proposalAnswerRequestSchema } from "@homelabconnect/shared";
import type { AnswerProposal } from "../../../application/appointments/AnswerProposal.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/Authenticate.js";
import { presentAppointment } from "../presenters/appointmentPresenter.js";
import { parseRequest } from "../requestValidation.js";

/** The patient's own answer; anyone else's appointment answers 404. */
export class AnswerProposalController implements Controller {
  constructor(private readonly answerProposal: AnswerProposal) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { id } = parseRequest(appointmentIdParamsSchema, request.params);
    const { accept } = parseRequest(proposalAnswerRequestSchema, request.body);
    const output = await this.answerProposal.execute({
      id,
      patientId: requireAuth(request).userId,
      accept,
    });
    return presentAppointment(output);
  }
}
