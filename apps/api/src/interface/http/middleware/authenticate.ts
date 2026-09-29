import type {
  AuthContext,
  AuthenticateRequest,
} from "../../../application/use-cases/authenticateRequest.js";
import {
  PasswordChangeRequired,
  Unauthenticated,
} from "../../../domain/identity/identityErrors.js";
import type { HttpRequest, Middleware } from "../httpTypes.js";

export interface AuthenticateOptions {
  /** Let users with a temporary password through (only for /me, /password and /logout). */
  allowPendingPasswordChange?: boolean;
}

const BEARER = /^Bearer\s+(\S+)$/i;

/** Reads the bearer token and attaches the AuthContext to the request. */
export class Authenticate implements Middleware {
  constructor(
    private readonly authenticateRequest: AuthenticateRequest,
    private readonly options: AuthenticateOptions = {},
  ) {}

  async handle(request: HttpRequest): Promise<HttpRequest> {
    const header = request.headers.authorization;
    const token = typeof header === "string" ? BEARER.exec(header)?.[1] : undefined;
    if (!token) throw new Unauthenticated();

    const auth = await this.authenticateRequest.execute({ token });
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
