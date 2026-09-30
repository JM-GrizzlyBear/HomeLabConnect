import { createStaffRequestSchema } from "@homelabconnect/shared";
import type { CreateStaffAccount } from "../../../application/use-cases/createStaffAccount.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentTemporaryPassword } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreateStaffAccountController implements Controller {
  constructor(private readonly createStaffAccount: CreateStaffAccount) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(createStaffRequestSchema, request.body);
    const output = await this.createStaffAccount.execute(body);
    return presentTemporaryPassword(output, 201);
  }
}
