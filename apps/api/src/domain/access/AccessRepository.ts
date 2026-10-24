import type { AccessData } from "./resolveAccess.js";
import type { BaseRole } from "../identity/baseRole.js";

/** Port: loads the grants and overrides that decide what a user may do. */
export interface AccessRepository {
  loadAccess(userId: string, baseRole: BaseRole): Promise<AccessData>;
}
