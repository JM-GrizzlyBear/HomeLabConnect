import { CannotDeactivateSelf, UserNotFound } from "../../domain/identity/identityErrors.js";
import type { SessionRepository } from "../../domain/identity/SessionRepository.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { toUserSummaryOutput, type UserSummaryOutput } from "./userSummaryOutput.js";

export interface SetUserActiveInput {
  /** The admin making the change. */
  actorId: string;
  userId: string;
  isActive: boolean;
}

/**
 * An admin deactivates or reactivates an account. Deactivating signs the user
 * out everywhere at once; reactivating lets them sign in again.
 */
export class SetUserActive {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
  ) {}

  async execute({ actorId, userId, isActive }: SetUserActiveInput): Promise<UserSummaryOutput> {
    if (!isActive && actorId === userId) throw new CannotDeactivateSelf();
    if (!(await this.users.findById(userId))) throw new UserNotFound();

    await this.users.setActive(userId, isActive);
    if (!isActive) await this.sessions.revokeAllForUser(userId);

    const item = await this.users.findListItem(userId);
    if (!item) throw new UserNotFound();
    return toUserSummaryOutput(item);
  }
}
