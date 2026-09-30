import { defaultBaseGrants, PERMISSION_KEYS, permissionModules } from "@homelabconnect/shared";
import { inArray, notInArray } from "drizzle-orm";
import type { Database } from "./client.js";
import { modules, permissions, rolePermissions } from "./schema/index.js";

/**
 * Makes the database match the shared permission catalogue: adds and relabels
 * modules and permissions, removes ones no longer in the catalogue, and resets
 * each base role's grants to the catalogue defaults. Safe to run repeatedly.
 */
export async function syncPermissionCatalog(db: Database): Promise<number> {
  const baseRoleIds = Object.keys(defaultBaseGrants) as (keyof typeof defaultBaseGrants)[];

  await db.transaction(async (tx) => {
    for (const [sort, module] of permissionModules.entries()) {
      await tx
        .insert(modules)
        .values({ id: module.id, name: module.name, sort })
        .onConflictDoUpdate({ target: modules.id, set: { name: module.name, sort } });
      for (const permission of module.permissions) {
        await tx
          .insert(permissions)
          .values({ id: permission.key, moduleId: module.id, label: permission.label })
          .onConflictDoUpdate({
            target: permissions.id,
            set: { moduleId: module.id, label: permission.label },
          });
      }
    }
    await tx.delete(permissions).where(notInArray(permissions.id, [...PERMISSION_KEYS]));
    await tx.delete(modules).where(
      notInArray(
        modules.id,
        permissionModules.map((module) => module.id),
      ),
    );

    // Base grants aren't editable in the app, so the catalogue is their source of truth.
    await tx.delete(rolePermissions).where(inArray(rolePermissions.roleId, baseRoleIds));
    await tx
      .insert(rolePermissions)
      .values(
        baseRoleIds.flatMap((roleId) =>
          defaultBaseGrants[roleId].map((permissionId) => ({ roleId, permissionId })),
        ),
      );
  });

  return PERMISSION_KEYS.length;
}
