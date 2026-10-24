import type {
  AuthContext,
  AuthenticateRequest,
} from "../../../application/identity/AuthenticateRequest.js";
import {
  PasswordChangeRequired,
  Unauthenticated,
} from "../../../domain/identity/identityErrors.js";
import type { HttpRequest, Middleware } from "../httpTypes.js";

export interface AuthenticateOptions {
  /** Let users with a temporary password through (only for /me, /password and /logout). */
  allowPendingPasswordChange?: boolean;
}

/** Reads who is signed in from the session cookie and attaches the AuthContext to the request. */
export class Authenticate implements Middleware {
  constructor(
    private readonly authenticateRequest: AuthenticateRequest,
    private readonly options: AuthenticateOptions = {},
  ) {}

  async handle(request: HttpRequest): Promise<HttpRequest> {
    const { userId, id: sessionId } = request.session;
    if (!userId) throw new Unauthenticated();

    const auth = await this.authenticateRequest.execute({ userId, sessionId });
    if (auth.mustChangePassword && !this.options.allowPendingPasswordChange) {
      throw new PasswordChangeRequired();
    }
    return { ...request, auth };
  }
}

/** For controllers behind Authenticate: the AuthContext, or 401 if the route was wired without it. */
export function requireAuth(request: HttpRequest): AuthContext {
  if (!request.auth) throw new Unauthenticated();
  return request.auth;
}
