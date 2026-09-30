import type { BaseRole } from "../identity/baseRole.js";
import { CannotChangeOwnRole, CustomRoleInUse, CustomRoleMismatch } from "./accessErrors.js";
import type { PermissionEntry } from "./resolveAccess.js";

/**
 * A named role built on top of a base role (e.g. "Senior Med Tech" on med
 * team). Its entries grant or deny single permissions; everything else is
 * inherited from the base role.
 */
export interface CustomRole {
  id: string;
  name: string;
  baseRole: BaseRole;
  description: string | null;
  entries: PermissionEntry[];
}

/** Business rule: a custom role only fits users of its own base role. */
export function assertRoleFitsUser(role: CustomRole, userBaseRole: BaseRole): void {
  if (role.baseRole !== userBaseRole) throw new CustomRoleMismatch();
}

/** Business rule: a role that someone holds can't be deleted. */
export function assertRoleUnused(userCount: number): void {
  if (userCount > 0) throw new CustomRoleInUse(userCount);
}

/** Business rule: nobody changes their own role, so an admin can't lock themselves out. */
export function assertNotOwnRole(actorId: string, userId: string): void {
  if (actorId === userId) throw new CannotChangeOwnRole();
}
