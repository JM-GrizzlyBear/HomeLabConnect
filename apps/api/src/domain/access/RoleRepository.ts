import type { CustomRole } from "../../domain/access/customRole.js";
import type { PermissionEntry } from "../../domain/access/resolveAccess.js";
import type { BaseRole } from "../../domain/identity/baseRole.js";

export interface BaseRoleRecord {
  id: BaseRole;
  name: string;
  /** What the base role grants. Admin lists every permission. */
  grants: string[];
  userCount: number;
}

export interface CustomRoleRecord extends CustomRole {
  userCount: number;
}

export interface NewCustomRole {
  name: string;
  baseRole: BaseRole;
  description: string | null;
  entries: PermissionEntry[];
}

export interface CustomRoleChanges {
  name: string;
  description: string | null;
  entries: PermissionEntry[];
}

/** Port: base roles (read-only) and admin-made custom roles. */
export interface RoleRepository {
  listBaseRoles(): Promise<BaseRoleRecord[]>;
  /** Sorted by name. */
  listCustomRoles(): Promise<CustomRoleRecord[]>;
  findCustomRole(id: string): Promise<CustomRoleRecord | null>;
  /** Case-insensitive. */
  findCustomRoleByName(name: string): Promise<CustomRole | null>;
  /** Throws CustomRoleNameTaken on a duplicate name. */
  createCustomRole(role: NewCustomRole): Promise<CustomRoleRecord>;
  /** Replaces name, description and every entry. Throws CustomRoleNameTaken on a duplicate. */
  updateCustomRole(id: string, changes: CustomRoleChanges): Promise<void>;
  deleteCustomRole(id: string): Promise<void>;
}
