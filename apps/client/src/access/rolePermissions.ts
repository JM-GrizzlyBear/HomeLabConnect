import type { PermissionEffect, PermissionEntry, PermissionKey } from "@homelabconnect/shared";

/** How a role's editor or viewer shows one permission. */
export interface PermissionState {
  /** What the base role gives on its own. */
  inherited: boolean;
  /** The custom role's explicit decision, or null to inherit. */
  effect: PermissionEffect | null;
  /** The result: allowed or not. */
  allowed: boolean;
}

/**
 * Mirrors the API's rule for a role (without user overrides): the custom role's
 * entry wins, otherwise the base role decides.
 */
export function permissionState(
  key: PermissionKey,
  baseGrants: readonly string[],
  entries: readonly PermissionEntry[],
): PermissionState {
  const inherited = baseGrants.includes(key);
  const effect = entries.find((entry) => entry.key === key)?.effect ?? null;
  return { inherited, effect, allowed: effect === null ? inherited : effect === "grant" };
}

/** "+3 / −1": how many permissions a custom role adds and removes. */
export function entrySummary(entries: readonly PermissionEntry[]): {
  granted: number;
  denied: number;
} {
  return {
    granted: entries.filter((entry) => entry.effect === "grant").length,
    denied: entries.filter((entry) => entry.effect === "deny").length,
  };
}
