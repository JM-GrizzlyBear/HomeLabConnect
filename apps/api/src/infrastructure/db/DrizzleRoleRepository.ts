import { asc, count, eq, sql } from "drizzle-orm";
import type {
  BaseRoleRecord,
  CustomRoleChanges,
  CustomRoleRecord,
  NewCustomRole,
  RoleRepository,
} from "../../domain/access/RoleRepository.js";
import { CustomRoleNameTaken } from "../../domain/access/accessErrors.js";
import type { CustomRole } from "../../domain/access/customRole.js";
import type { PermissionEntry } from "../../domain/access/resolveAccess.js";
import { isBaseRole } from "../../domain/identity/baseRole.js";
import type { Database } from "./client.js";
import { isUniqueViolation } from "./errors.js";
import {
  customRolePermissions,
  customRoles,
  permissions,
  rolePermissions,
  roles,
  users,
} from "./schema/index.js";

type CustomRoleRow = typeof customRoles.$inferSelect;

function toCustomRole(row: CustomRoleRow, entries: PermissionEntry[]): CustomRole {
  if (!isBaseRole(row.baseRoleId)) {
    throw new Error(`Custom role ${row.id} has unknown base role "${row.baseRoleId}".`);
  }
  return {
    id: row.id,
    name: row.name,
    baseRole: row.baseRoleId,
    description: row.description,
    entries,
  };
}

/** Base roles in the order people think of them. */
const BASE_ROLE_ORDER = ["patient", "med_team", "doctor", "support", "admin"];

export class DrizzleRoleRepository implements RoleRepository {
  constructor(private readonly db: Database) {}

  async listBaseRoles(): Promise<BaseRoleRecord[]> {
    const [roleRows, grants, allPermissions, counts] = await Promise.all([
      this.db.select().from(roles),
      this.db.select().from(rolePermissions),
      this.db.select({ id: permissions.id }).from(permissions),
      this.db.select({ roleId: users.roleId, total: count() }).from(users).groupBy(users.roleId),
    ]);
    return roleRows
      .filter((row) => isBaseRole(row.id))
      .map((row) => ({
        id: row.id as BaseRoleRecord["id"],
        name: row.name,
        // Admin always has every permission, so it has no grant rows.
        grants:
          row.id === "admin"
            ? allPermissions.map((permission) => permission.id).sort()
            : grants
                .filter((grant) => grant.roleId === row.id)
                .map((grant) => grant.permissionId)
                .sort(),
        userCount: counts.find((entry) => entry.roleId === row.id)?.total ?? 0,
      }))
      .sort((a, b) => BASE_ROLE_ORDER.indexOf(a.id) - BASE_ROLE_ORDER.indexOf(b.id));
  }

  async listCustomRoles(): Promise<CustomRoleRecord[]> {
    const rows = await this.db.select().from(customRoles).orderBy(asc(customRoles.name));
    return this.withDetails(rows);
  }

  async findCustomRole(id: string): Promise<CustomRoleRecord | null> {
    const rows = await this.db.select().from(customRoles).where(eq(customRoles.id, id));
    const [role] = await this.withDetails(rows);
    return role ?? null;
  }

  async findCustomRoleByName(name: string): Promise<CustomRole | null> {
    const [row] = await this.db
      .select()
      .from(customRoles)
      .where(eq(sql`lower(${customRoles.name})`, name.trim().toLowerCase()));
    return row ? toCustomRole(row, []) : null;
  }

  async createCustomRole(role: NewCustomRole): Promise<CustomRoleRecord> {
    const id = await this.write(async (tx) => {
      const [row] = await tx
        .insert(customRoles)
        .values({ name: role.name, baseRoleId: role.baseRole, description: role.description })
        .returning({ id: customRoles.id });
      if (!row) throw new Error("Insert into custom_roles returned no row.");
      await this.replaceEntries(tx, row.id, role.entries);
      return row.id;
    });
    const created = await this.findCustomRole(id);
    if (!created) throw new Error(`Custom role ${id} vanished after insert.`);
    return created;
  }

  async updateCustomRole(id: string, changes: CustomRoleChanges): Promise<void> {
    await this.write(async (tx) => {
      await tx
        .update(customRoles)
        .set({ name: changes.name, description: changes.description })
        .where(eq(customRoles.id, id));
      await this.replaceEntries(tx, id, changes.entries);
    });
  }

  async deleteCustomRole(id: string): Promise<void> {
    await this.db.delete(customRoles).where(eq(customRoles.id, id));
  }

  /** Runs a write in a transaction, turning a duplicate name into CustomRoleNameTaken. */
  private async write<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    try {
      return await this.db.transaction(work);
    } catch (error) {
      if (isUniqueViolation(error)) throw new CustomRoleNameTaken();
      throw error;
    }
  }

  private async replaceEntries(tx: Transaction, roleId: string, entries: PermissionEntry[]) {
    await tx.delete(customRolePermissions).where(eq(customRolePermissions.customRoleId, roleId));
    if (entries.length === 0) return;
    await tx.insert(customRolePermissions).values(
      entries.map((entry) => ({
        customRoleId: roleId,
        permissionId: entry.key,
        effect: entry.effect,
      })),
    );
  }

  /** Adds each role's entries and how many users hold it. */
  private async withDetails(rows: CustomRoleRow[]): Promise<CustomRoleRecord[]> {
    if (rows.length === 0) return [];
    const [entries, counts] = await Promise.all([
      this.db.select().from(customRolePermissions),
      this.db
        .select({ roleId: users.customRoleId, total: count() })
        .from(users)
        .groupBy(users.customRoleId),
    ]);
    return rows.map((row) => ({
      ...toCustomRole(
        row,
        entries
          .filter((entry) => entry.customRoleId === row.id)
          .map((entry) => ({ key: entry.permissionId, effect: entry.effect }))
          .sort((a, b) => a.key.localeCompare(b.key)),
      ),
      userCount: counts.find((entry) => entry.roleId === row.id)?.total ?? 0,
    }));
  }
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
