import { eq } from "drizzle-orm";
import type { AccessRepository } from "../../application/ports/accessRepository.js";
import type { AccessData } from "../../domain/access/resolveAccess.js";
import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import { customRolePermissions, permissions, rolePermissions, users } from "./schema/index.js";

export class DrizzleAccessRepository implements AccessRepository {
  constructor(private readonly db: Database) {}

  async loadAccess(userId: string, baseRole: BaseRole): Promise<AccessData> {
    const [all, grants, customRole] = await Promise.all([
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
    ]);
    return {
      baseRole,
      allPermissions: all.map((row) => row.id),
      baseGrants: grants.map((row) => row.id),
      customRole,
      // Per-user overrides (slice C) plug in here.
      overrides: [],
    };
  }
}
