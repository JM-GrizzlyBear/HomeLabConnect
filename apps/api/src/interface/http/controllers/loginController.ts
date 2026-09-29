import { loginRequestSchema } from "@homelabconnect/shared";
import type { Login } from "../../../application/use-cases/login.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentLogin } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class LoginController implements Controller {
  constructor(private readonly login: Login) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(loginRequestSchema, request.body);
    const userAgent = request.headers["user-agent"];
    const output = await this.login.execute({
      ...body,
      ipAddress: request.ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
    return presentLogin(output);
  }
}
