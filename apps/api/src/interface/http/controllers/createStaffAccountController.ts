import { createStaffRequestSchema } from "@homelabconnect/shared";
import type { CreateStaffAccount } from "../../../application/use-cases/createStaffAccount.js";
import { PermissionDenied } from "../../../domain/access/accessErrors.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { requireAuth } from "../middleware/authenticate.js";
import { presentTemporaryPassword } from "../presenters/userAdminPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class CreateStaffAccountController implements Controller {
  constructor(private readonly createStaffAccount: CreateStaffAccount) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(createStaffRequestSchema, request.body);
    // Giving the new account a custom role is role assignment, so it needs roles.assign too.
    if (body.customRoleId !== null && !requireAuth(request).permissions.has("roles.assign")) {
      throw new PermissionDenied();
    }
    const output = await this.createStaffAccount.execute(body);
    return presentTemporaryPassword(output, 201);
  }
}
