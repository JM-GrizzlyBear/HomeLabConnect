import { effectivePermissions } from "../../domain/access/resolveAccess.js";
import type { User } from "../../domain/identity/user.js";
import type { AccessRepository } from "../../domain/access/AccessRepository.js";
import type { Clock } from "../ports/Clock.js";

/**
 * A user's effective permission keys right now. Computed on every request, so
 * a changed role or override takes effect on the user's next click.
 */
export class ResolvePermissions {
  constructor(
    private readonly access: AccessRepository,
    private readonly clock: Clock,
  ) {}

  async execute(user: User): Promise<string[]> {
    const access = await this.access.loadAccess(user.id, user.role);
    return effectivePermissions(access, this.clock.now());
  }
}
