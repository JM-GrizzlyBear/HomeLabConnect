import type { BaseRole } from "../../domain/identity/baseRole.js";
import { Unauthenticated } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import type { ResolvePermissions } from "../access/ResolvePermissions.js";

export interface AuthenticateRequestInput {
  /** The user the session belongs to. */
  userId: string;
  sessionId: string;
}

/** Who is making the request. Role and flags come from the database, not the session. */
export interface AuthContext {
  userId: string;
  sessionId: string;
  role: BaseRole;
  mustChangePassword: boolean;
  /** Effective permission keys, resolved fresh for this request. */
  permissions: ReadonlySet<string>;
}

/**
 * Turns a signed-in session into an AuthContext. The user is loaded on every
 * request, so a deactivation or a permission change applies on their next click.
 */
export class AuthenticateRequest {
  constructor(
    private readonly users: UserRepository,
    private readonly permissions: ResolvePermissions,
  ) {}

  async execute(input: AuthenticateRequestInput): Promise<AuthContext> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new Unauthenticated();
    user.assertCanSignIn();

    return {
      userId: user.id,
      sessionId: input.sessionId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      permissions: new Set(await this.permissions.execute(user)),
    };
  }
}
