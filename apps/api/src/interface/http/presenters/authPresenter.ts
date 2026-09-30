import type { CurrentUser, LoginResponse, SessionUser } from "@homelabconnect/shared";
import type { LoginOutput } from "../../../application/use-cases/login.js";
import type { SessionUserOutput, UserOutput } from "../../../application/use-cases/userOutput.js";
import type { HttpResponse } from "../httpTypes.js";

export function presentUser(output: UserOutput, status = 200): HttpResponse<CurrentUser> {
  return {
    status,
    body: {
      id: output.id,
      email: output.email,
      role: output.role,
      firstName: output.firstName,
      lastName: output.lastName,
      mustChangePassword: output.mustChangePassword,
    },
  };
}

export function presentSessionUser(output: SessionUserOutput): HttpResponse<SessionUser> {
  return {
    status: 200,
    body: { ...presentUser(output).body, permissions: output.permissions },
  };
}

export function presentLogin(output: LoginOutput): HttpResponse<LoginResponse> {
  return {
    status: 200,
    body: {
      token: output.token,
      expiresAt: output.expiresAt.toISOString(),
      user: presentSessionUser(output.user).body,
    },
  };
}

export function presentNoContent(): HttpResponse<undefined> {
  return { status: 204, body: undefined };
}
