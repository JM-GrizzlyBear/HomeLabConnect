import type { CurrentUser, LoginResponse, SessionUser } from "@homelabconnect/shared";
import type { LoginOutput } from "../../../application/identity/Login.js";
import type { SessionUserOutput, UserOutput } from "../../../application/identity/userOutput.js";
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
      photoUrl: output.photoUrl,
    },
  };
}

export function presentSessionUser(output: SessionUserOutput): HttpResponse<SessionUser> {
  return {
    status: 200,
    body: { ...presentUser(output).body, permissions: output.permissions },
  };
}

/** Answers with the user and tells the HTTP layer to start their session (sets the cookie). */
export function presentLogin(output: LoginOutput): HttpResponse<LoginResponse> {
  return {
    status: 200,
    body: { user: presentSessionUser(output.user).body },
    session: { signIn: output.user.id },
  };
}

/** Ends the session (deletes it and clears the cookie). */
export function presentLogout(): HttpResponse<undefined> {
  return { status: 204, body: undefined, session: { signOut: true } };
}

export function presentNoContent(): HttpResponse<undefined> {
  return { status: 204, body: undefined };
}
