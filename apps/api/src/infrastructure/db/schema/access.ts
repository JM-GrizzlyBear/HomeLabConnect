import { sql } from "drizzle-orm";
import { integer, pgTable, primaryKey, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./columns.js";
import { roles } from "./roles.js";

/** Groups of permissions, e.g. "payments". Written by the seed from the shared catalogue. */
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sort: integer("sort").notNull(),
});

/** One action a user can be allowed, keyed "<module>.<action>" (e.g. "payments.refund"). */
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  moduleId: text("module_id")
    .notNull()
    .references(() => modules.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
});

/** What each base role grants. Admins get every permission and have no rows here. */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })],
);

/** Admin-made roles on top of a base role, e.g. "Senior Med Tech" on med_team. */
export const customRoles = pgTable(
  "custom_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    baseRoleId: text("base_role_id")
      .notNull()
      .references(() => roles.id),
    description: text("description"),
    ...timestamps,
  },
  // Names are unique ignoring case, so "President" and "president" can't both exist.
  (table) => [uniqueIndex("custom_roles_name_lower_idx").on(sql`lower(${table.name})`)],
);

/** A custom role's explicit grant or deny for one permission. Unlisted keys are inherited. */
export const customRolePermissions = pgTable(
  "custom_role_permissions",
  {
    customRoleId: uuid("custom_role_id")
      .notNull()
      .references(() => customRoles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    effect: text("effect", { enum: ["grant", "deny"] }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.customRoleId, table.permissionId] })],
);
