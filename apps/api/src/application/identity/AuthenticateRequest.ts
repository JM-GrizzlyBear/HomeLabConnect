import type { BaseRole } from "../../domain/identity/baseRole.js";
import { Unauthenticated } from "../../domain/identity/identityErrors.js";
import { isSessionActive } from "../../domain/identity/session.js";
import type { Clock } from "../ports/clock.js";
import type { SessionRepository } from "../ports/sessionRepository.js";
import type { TokenService } from "../ports/tokenService.js";
import type { UserRepository } from "../ports/userRepository.js";
import type { ResolvePermissions } from "./resolvePermissions.js";

export interface AuthenticateRequestInput {
  token: string;
}

/** Who is making the request. Role and flags come from the database, not the token. */
export interface AuthContext {
  userId: string;
  sessionId: string;
  role: BaseRole;
  mustChangePassword: boolean;
  /** Effective permission keys, resolved fresh for this request. */
  permissions: ReadonlySet<string>;
}

/**
 * Turns a bearer token into an AuthContext. The token alone isn't enough: its
 * session must still be active and its user still active, so logout and
 * deactivation take effect immediately.
 */
export class AuthenticateRequest {
  constructor(
    private readonly tokens: TokenService,
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly clock: Clock,
    private readonly permissions: ResolvePermissions,
  ) {}

  async execute(input: AuthenticateRequestInput): Promise<AuthContext> {
    const claims = this.tokens.verify(input.token);
    if (!claims) throw new Unauthenticated();

    const session = await this.sessions.findById(claims.sessionId);
    if (
      !session ||
      session.userId !== claims.userId ||
      !isSessionActive(session, this.clock.now())
    ) {
      throw new Unauthenticated();
    }

    const user = await this.users.findById(claims.userId);
    if (!user) throw new Unauthenticated();
    user.assertCanSignIn();

    return {
      userId: user.id,
      sessionId: session.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      permissions: new Set(await this.permissions.execute(user)),
    };
  }
}
