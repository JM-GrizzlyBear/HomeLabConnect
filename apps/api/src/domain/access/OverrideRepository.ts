import type { PermissionOverride } from "./resolveAccess.js";

/** Port: per-user permission overrides (what ResolvePermissions checks first). */
export interface OverrideRepository {
  /** Every override the user has, expired ones included. */
  list(userId: string): Promise<PermissionOverride[]>;
  /** Replaces all of them at once. */
  replace(
    userId: string,
    overrides: readonly PermissionOverride[],
    grantedBy: string,
  ): Promise<void>;
}
