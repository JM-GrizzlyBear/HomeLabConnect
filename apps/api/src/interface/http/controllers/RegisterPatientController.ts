import { registerPatientRequestSchema } from "@homelabconnect/shared";
import type { RegisterPatient } from "../../../application/use-cases/registerPatient.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentUser } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class RegisterPatientController implements Controller {
  constructor(private readonly registerPatient: RegisterPatient) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(registerPatientRequestSchema, request.body);
    const output = await this.registerPatient.execute({
      ...body,
      birthDate: body.birthDate ?? null,
      address: body.address ?? null,
    });
    return presentUser(output, 201);
  }
}
