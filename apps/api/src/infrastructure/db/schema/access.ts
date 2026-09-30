import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
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
