import type { AccessRepository } from "../../domain/access/AccessRepository.js";
import { CannotOverrideOwnPermissions, InvalidOverride } from "../../domain/access/accessErrors.js";
import type { OverrideRepository } from "../../domain/access/OverrideRepository.js";
import {
  decidePermission,
  isOverrideActive,
  type PermissionDecision,
  type PermissionEffect,
} from "../../domain/access/resolveAccess.js";
import type { BaseRole } from "../../domain/identity/baseRole.js";
import { UserNotFound } from "../../domain/identity/identityErrors.js";
import type { UserRepository } from "../../domain/identity/UserRepository.js";
import { addDays, businessDate, businessDateTime } from "../../domain/time/businessDate.js";
import type { Clock } from "../ports/Clock.js";

/** An override as people set it: through the end of `until` (Philippine time), or for good. */
export interface OverrideInput {
  key: string;
  effect: PermissionEffect;
  until: string | null;
}

export interface UserPermissionsOutput {
  userId: string;
  name: string;
  role: BaseRole;
  customRole: string | null;
  /** `inherited`: what their role alone (base or custom) would decide. */
  permissions: ({ key: string; inherited: boolean } & PermissionDecision)[];
  overrides: OverrideInput[];
}

/** Ends at the next midnight after `until`, so the override covers that whole day. */
const expiryOf = (until: string | null) =>
  until === null ? null : businessDateTime(addDays(until, 1), "00:00");
const untilOf = (expiresAt: Date | null) =>
  expiresAt === null ? null : businessDate(new Date(expiresAt.getTime() - 1));

/** What one person may do, each permission with where it comes from, and their overrides. */
export class GetUserPermissions {
  constructor(
    private readonly users: UserRepository,
    private readonly access: AccessRepository,
    private readonly clock: Clock,
  ) {}

  async execute(userId: string): Promise<UserPermissionsOutput> {
    const item = await this.users.findListItem(userId);
    if (!item) throw new UserNotFound();
    const { user } = item;
    const now = this.clock.now();
    const access = await this.access.loadAccess(user.id, user.role);
    return {
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      customRole: item.customRole?.name ?? null,
      permissions: [...access.allPermissions].sort().map((key) => ({
        key,
        inherited: decidePermission({ ...access, overrides: [] }, key, now).granted,
        ...decidePermission(access, key, now),
      })),
      overrides: access.overrides
        .filter((override) => isOverrideActive(override, now))
        .map((override) => ({
          key: override.key,
          effect: override.effect,
          until: untilOf(override.expiresAt),
        })),
    };
  }
}

/**
 * An admin grants or denies one person specific permissions, for good or until a date; it
 * applies on their next click. Admins already have everything, and nobody overrides themselves.
 */
export class SetUserOverrides {
  constructor(
    private readonly users: UserRepository,
    private readonly access: AccessRepository,
    private readonly overrides: OverrideRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    userId: string;
    actorId: string;
    overrides: readonly OverrideInput[];
  }): Promise<UserPermissionsOutput> {
    if (input.userId === input.actorId) throw new CannotOverrideOwnPermissions();
    const user = await this.users.findById(input.userId);
    if (!user) throw new UserNotFound();
    if (user.role === "admin") {
      throw new InvalidOverride("Admins always have every permission.");
    }
    const { allPermissions } = await this.access.loadAccess(user.id, user.role);
    const today = businessDate(this.clock.now());
    const keys = new Set<string>();
    for (const override of input.overrides) {
      if (!allPermissions.includes(override.key)) {
        throw new InvalidOverride(`There's no permission called ${override.key}.`);
      }
      if (keys.has(override.key)) {
        throw new InvalidOverride(`${override.key} is listed twice.`);
      }
      if (override.until !== null && override.until < today) {
        throw new InvalidOverride("An end date can't be in the past.");
      }
      keys.add(override.key);
    }
    await this.overrides.replace(
      user.id,
      input.overrides.map((override) => ({
        key: override.key,
        effect: override.effect,
        expiresAt: expiryOf(override.until),
      })),
      input.actorId,
    );
    return await new GetUserPermissions(this.users, this.access, this.clock).execute(user.id);
  }
}
