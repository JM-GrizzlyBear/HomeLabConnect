import {
  IncorrectCurrentPassword,
  PasswordUnchanged,
  UserNotFound,
} from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import type { Clock } from "../ports/clock.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { SessionRepository } from "../ports/sessionRepository.js";
import type { UserRepository } from "../ports/userRepository.js";
import { toUserOutput, type UserOutput } from "./userOutput.js";

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
  ) {}

  async execute(input: ChangePasswordInput): Promise<UserOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFound();
    if (!(await this.hasher.verify(input.currentPassword, user.passwordHash))) {
      throw new IncorrectCurrentPassword();
    }
    assertPasswordIsStrong(input.newPassword);
    if (input.newPassword === input.currentPassword) throw new PasswordUnchanged();

    await this.users.updatePassword(user.id, await this.hasher.hash(input.newPassword));
    await this.sessions.revokeAllForUser(user.id, this.clock.now(), input.sessionId);

    const updated = await this.users.findById(user.id);
    if (!updated) throw new UserNotFound();
    return toUserOutput(updated);
  }
}
