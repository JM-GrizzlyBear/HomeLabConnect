import { AccountDeactivated, UserNotFound } from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import { temporaryPasswordExpiry } from "../../domain/identity/temporaryPassword.js";
import type { AccountEmails } from "../ports/accountEmails.js";
import type { Clock } from "../ports/clock.js";
import type { PasswordHasher } from "../ports/passwordHasher.js";
import type { SessionRepository } from "../ports/sessionRepository.js";
import type { TemporaryPasswordGenerator } from "../ports/temporaryPasswordGenerator.js";
import type { UserRepository } from "../ports/userRepository.js";
import {
  deliverTemporaryPassword,
  type TemporaryPasswordOutput,
} from "./temporaryPasswordOutput.js";

export interface ReissueTemporaryPasswordInput {
  userId: string;
}

/**
 * An admin emails a user a new temporary password, valid for another 7 days.
 * The old password and every open session stop working straight away.
 */
export class ReissueTemporaryPassword {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly passwords: TemporaryPasswordGenerator,
    private readonly emails: AccountEmails,
    private readonly clock: Clock,
  ) {}

  async execute({ userId }: ReissueTemporaryPasswordInput): Promise<TemporaryPasswordOutput> {
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFound();
    if (!user.isActive) throw new AccountDeactivated();

    const temporaryPassword = this.passwords.generate();
    assertPasswordIsStrong(temporaryPassword);
    const now = this.clock.now();
    const expiresAt = temporaryPasswordExpiry(now);

    await this.users.setTemporaryPassword(
      user.id,
      await this.hasher.hash(temporaryPassword),
      expiresAt,
    );
    await this.sessions.revokeAllForUser(user.id, now);

    const updated = await this.users.findById(user.id);
    if (!updated) throw new UserNotFound();
    return deliverTemporaryPassword(updated, temporaryPassword, expiresAt, () =>
      this.emails.sendTemporaryPasswordReissued({
        to: updated.email,
        firstName: updated.firstName,
        temporaryPassword,
        expiresAt,
      }),
    );
  }
}
