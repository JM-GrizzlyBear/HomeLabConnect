import { InvalidResetLink } from "../../domain/identity/identityErrors.js";
import { assertPasswordIsStrong } from "../../domain/identity/passwordPolicy.js";
import {
  PASSWORD_RESET_TTL_MS,
  type PasswordResetRepository,
} from "../../domain/identity/PasswordResetRepository.js";
import type { SessionRepository } from "../../domain/identity/SessionRepository.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import type { AccountEmails } from "../ports/AccountEmails.js";
import type { Clock } from "../ports/Clock.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { SecretTokens } from "../ports/SecretTokens.js";

/**
 * "Forgot password?": emails a link that works for an hour. The answer is the same whether or
 * not the email has an account, so nobody can use this to find out who is registered.
 */
export class RequestPasswordReset {
  constructor(
    private readonly users: UserRepository,
    private readonly resets: PasswordResetRepository,
    private readonly tokens: SecretTokens,
    private readonly emails: AccountEmails,
    private readonly clock: Clock,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user?.isActive) return;
    const token = this.tokens.generate();
    const expiresAt = new Date(this.clock.now().getTime() + PASSWORD_RESET_TTL_MS);
    await this.resets.create({ userId: user.id, token, expiresAt });
    try {
      await this.emails.sendPasswordReset({
        to: user.email,
        firstName: user.firstName,
        token,
        expiresAt,
      });
    } catch {
      // Answer the same either way; the person can ask again
    }
  }
}

/**
 * Sets a new password from a reset link. The link works once; every browser the account is
 * signed in on is signed out, and a pending temporary password no longer applies.
 */
export class ResetPassword {
  constructor(
    private readonly users: UserRepository,
    private readonly resets: PasswordResetRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly clock: Clock,
  ) {}

  async execute({ token, newPassword }: { token: string; newPassword: string }): Promise<string> {
    const now = this.clock.now();
    const reset = await this.resets.findByToken(token);
    if (!reset || reset.usedAt || reset.expiresAt <= now) throw new InvalidResetLink();
    const user = await this.users.findById(reset.userId);
    if (!user?.isActive) throw new InvalidResetLink();
    assertPasswordIsStrong(newPassword);

    if (!(await this.resets.markUsed(reset.id, now))) throw new InvalidResetLink();
    await this.users.updatePassword(user.id, await this.hasher.hash(newPassword));
    await this.sessions.revokeAllForUser(user.id);
    return user.id;
  }
}
