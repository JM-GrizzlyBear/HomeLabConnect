import { eq } from "drizzle-orm";
import type { AccessRepository } from "../../domain/access/AccessRepository.js";
import type { AccessData } from "../../domain/access/resolveAccess.js";
import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import {
  customRolePermissions,
  permissions,
  rolePermissions,
  userPermissionOverrides,
  users,
} from "./schema/index.js";

export class DrizzleAccessRepository implements AccessRepository {
  constructor(private readonly db: Database) {}

  async loadAccess(userId: string, baseRole: BaseRole): Promise<AccessData> {
    const [all, grants, customRole, overrides] = await Promise.all([
      this.db.select({ id: permissions.id }).from(permissions),
      this.db
        .select({ id: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, baseRole)),
      this.db
        .select({ key: customRolePermissions.permissionId, effect: customRolePermissions.effect })
        .from(customRolePermissions)
        .innerJoin(users, eq(users.customRoleId, customRolePermissions.customRoleId))
        .where(eq(users.id, userId)),
      this.db
        .select({
          key: userPermissionOverrides.permissionId,
          effect: userPermissionOverrides.effect,
          expiresAt: userPermissionOverrides.expiresAt,
        })
        .from(userPermissionOverrides)
        .where(eq(userPermissionOverrides.userId, userId)),
    ]);
    return {
      baseRole,
      allPermissions: all.map((row) => row.id),
      baseGrants: grants.map((row) => row.id),
      customRole,
      overrides,
    };
  }
}
