import { loginRequestSchema } from "@homelabconnect/shared";
import type { Login } from "../../../application/identity/Login.js";
import type { Controller, HttpRequest, HttpResponse } from "../httpTypes.js";
import { presentLogin } from "../presenters/authPresenter.js";
import { parseRequest } from "../requestValidation.js";

export class LoginController implements Controller {
  constructor(private readonly login: Login) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    const body = parseRequest(loginRequestSchema, request.body);
    return presentLogin(await this.login.execute(body));
  }
}
