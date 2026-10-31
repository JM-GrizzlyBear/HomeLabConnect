import { forgotPasswordRequestSchema, resetPasswordRequestSchema } from "@homelabconnect/shared";
import type {
  RequestPasswordReset,
  ResetPassword,
} from "../../../application/identity/PasswordReset.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { parseRequest } from "../requestValidation.js";

/** Always 204, whether or not the email has an account. */
export class RequestPasswordResetController implements Controller {
  constructor(private readonly requestPasswordReset: RequestPasswordReset) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const { email } = parseRequest(forgotPasswordRequestSchema, request.body);
    await this.requestPasswordReset.execute(email);
    return { status: 204, body: undefined };
  }
}

/** Answers with whose password changed (for the audit log); the browser then signs in. */
export class ResetPasswordController implements Controller {
  constructor(private readonly resetPassword: ResetPassword) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(resetPasswordRequestSchema, request.body);
    const userId = await this.resetPassword.execute(body);
    return { status: 200, body: { userId } };
  }
}
