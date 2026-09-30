import type { BaseRole } from "../identity/baseRole.js";

export type PermissionEffect = "grant" | "deny";

/** A custom role's explicit decision on one permission. Keys it doesn't list are inherited. */
export interface PermissionEntry {
  key: string;
  effect: PermissionEffect;
}

/** A per-user decision on one permission, optionally until a given time. */
export interface PermissionOverride extends PermissionEntry {
  expiresAt: Date | null;
}

/** Everything that decides what one user may do. */
export interface AccessData {
  baseRole: BaseRole;
  /** Every permission in the catalogue. Admins start with all of them. */
  allPermissions: readonly string[];
  /** What the base role grants. Ignored for admins, who get everything. */
  baseGrants: readonly string[];
  /** Entries of the user's custom role, if any. */
  customRole: readonly PermissionEntry[];
  /** The user's overrides, including expired ones (they are skipped here). */
  overrides: readonly PermissionOverride[];
}

export type PermissionSource = "override" | "custom_role" | "base_role" | "none";

export interface PermissionDecision {
  granted: boolean;
  source: PermissionSource;
}

export function isOverrideActive(override: PermissionOverride, now: Date): boolean {
  return override.expiresAt === null || override.expiresAt > now;
}

/**
 * Business rule: user override → custom role → base role → deny. The first
 * layer with an opinion on the key decides, whether it grants or denies.
 */
export function decidePermission(access: AccessData, key: string, now: Date): PermissionDecision {
  const override = access.overrides.find(
    (entry) => entry.key === key && isOverrideActive(entry, now),
  );
  if (override) return { granted: override.effect === "grant", source: "override" };

  const custom = access.customRole.find((entry) => entry.key === key);
  if (custom) return { granted: custom.effect === "grant", source: "custom_role" };

  const base = access.baseRole === "admin" || access.baseGrants.includes(key);
  return base ? { granted: true, source: "base_role" } : { granted: false, source: "none" };
}

/** The keys a user may use right now, sorted. */
export function effectivePermissions(access: AccessData, now: Date): string[] {
  return access.allPermissions.filter((key) => decidePermission(access, key, now).granted).sort();
}
