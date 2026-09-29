import type { Clock } from "../ports/clock.js";
import type { SessionRepository } from "../ports/sessionRepository.js";

export interface LogoutInput {
  sessionId: string;
}

/** Revokes the current session, so its token stops working immediately. */
export class Logout {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    await this.sessions.revoke(input.sessionId, this.clock.now());
  }
}
