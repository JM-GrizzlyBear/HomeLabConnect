import { pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { permissions } from "./access.js";
import { timestamptz } from "./columns.js";
import { users } from "./users.js";

/** One person's grant or denial of one permission, optionally until a time. Checked first. */
export const userPermissionOverrides = pgTable(
  "user_permission_overrides",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    effect: text("effect", { enum: ["grant", "deny"] }).notNull(),
    /** Null: until it's removed. */
    expiresAt: timestamptz("expires_at"),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permissionId] })],
);
