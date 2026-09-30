import { eq } from "drizzle-orm";
import type { AccessRepository } from "../../application/ports/accessRepository.js";
import type { AccessData } from "../../domain/access/resolveAccess.js";
import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import { permissions, rolePermissions } from "./schema/index.js";

export class DrizzleAccessRepository implements AccessRepository {
  constructor(private readonly db: Database) {}

  async loadAccess(_userId: string, baseRole: BaseRole): Promise<AccessData> {
    const [all, grants] = await Promise.all([
      this.db.select({ id: permissions.id }).from(permissions),
      this.db
        .select({ id: rolePermissions.permissionId })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, baseRole)),
    ]);
    return {
      baseRole,
      allPermissions: all.map((row) => row.id),
      baseGrants: grants.map((row) => row.id),
      // Custom roles (slice B) and overrides (slice C) plug in here.
      customRole: [],
      overrides: [],
    };
  }
}
