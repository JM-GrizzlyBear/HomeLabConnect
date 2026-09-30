import { type PermissionKey, PERMISSION_KEYS } from "@homelabconnect/shared";
import { eq, sql } from "drizzle-orm";
import type { BaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import { customRolePermissions, customRoles } from "./schema/index.js";

interface SeedCustomRole {
  name: string;
  baseRole: BaseRole;
  description: string;
  entries: { key: PermissionKey; effect: "grant" | "deny" }[];
}

/** The custom roles from docs/SYSTEM.md §10. */
const seedRoles: SeedCustomRole[] = [
  {
    name: "President",
    baseRole: "admin",
    description: "Runs the business: sees everything, but leaves settings and roles to admins.",
    entries: [
      { key: "settings.manage", effect: "deny" },
      { key: "roles.manage", effect: "deny" },
    ],
  },
  {
    name: "Senior Med Tech",
    baseRole: "med_team",
    description: "Leads a med team: plans routes and rosters and approves leave.",
    entries: [
      { key: "routes.manage", effect: "grant" },
      { key: "teams.roster", effect: "grant" },
      { key: "leave.approve", effect: "grant" },
    ],
  },
];

/**
 * Creates the seed custom roles if they don't exist yet and returns their ids
 * by name. Existing roles are left alone, so admins' edits survive a re-seed.
 */
export async function seedCustomRoles(db: Database): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const role of seedRoles) {
    for (const entry of role.entries) {
      if (!PERMISSION_KEYS.includes(entry.key)) throw new Error(`Unknown permission ${entry.key}`);
    }
    const [existing] = await db
      .select({ id: customRoles.id })
      .from(customRoles)
      .where(eq(sql`lower(${customRoles.name})`, role.name.toLowerCase()));
    if (existing) {
      ids.set(role.name, existing.id);
      continue;
    }
    await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(customRoles)
        .values({ name: role.name, baseRoleId: role.baseRole, description: role.description })
        .returning({ id: customRoles.id });
      if (!row) throw new Error(`Insert of custom role ${role.name} returned no row.`);
      await tx.insert(customRolePermissions).values(
        role.entries.map((entry) => ({
          customRoleId: row.id,
          permissionId: entry.key,
          effect: entry.effect,
        })),
      );
      ids.set(role.name, row.id);
    });
  }
  return ids;
}
