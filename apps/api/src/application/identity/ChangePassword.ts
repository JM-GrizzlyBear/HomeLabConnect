import {
  IncorrectCurrentPassword,
  PasswordUnchanged,
  UserNotFound,
} from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import type { Clock } from "../ports/Clock.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { SessionRepository } from "../../domain/identity/SessionRepository.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import type { ResolvePermissions } from "../access/ResolvePermissions.js";
import { type SessionUserOutput, toUserOutput } from "./userOutput.js";

export interface ChangePasswordInput {
  userId: string;
  /** The session making the change. It stays signed in; every other session is revoked. */
  sessionId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * A signed-in user replaces their password, including a temporary one. Other
 * devices are signed out, so a leaked password stops working everywhere.
 */
export class ChangePassword {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
    private readonly permissions: ResolvePermissions,
  ) {}

  async execute(input: ChangePasswordInput): Promise<SessionUserOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFound();
    if (!(await this.hasher.verify(input.currentPassword, user.passwordHash))) {
      throw new IncorrectCurrentPassword();
    }
    user.assertTemporaryPasswordValid(this.clock.now());
    assertPasswordIsStrong(input.newPassword);
    if (input.newPassword === input.currentPassword) throw new PasswordUnchanged();

    await this.users.updatePassword(user.id, await this.hasher.hash(input.newPassword));
    await this.sessions.revokeAllForUser(user.id, input.sessionId);

    const updated = await this.users.findById(user.id);
    if (!updated) throw new UserNotFound();
    return { ...toUserOutput(updated), permissions: await this.permissions.execute(updated) };
  }
}
