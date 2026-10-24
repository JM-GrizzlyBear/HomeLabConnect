import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, timestamptz } from "./columns.js";
import { customRoles } from "./access.js";
import { roles } from "./roles.js";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Always stored lower-cased, so the unique constraint ignores case. */
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  /** When the temporary password stops working. Null once a permanent password is set. */
  temporaryPasswordExpiresAt: timestamptz("temporary_password_expires_at"),
  /** Optional custom role on top of role_id. A role can't be deleted while users hold it. */
  customRoleId: uuid("custom_role_id").references(() => customRoles.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  /** Profile photo link (Cloudinary, or /api/uploads locally), and the key to delete it. */
  photoUrl: text("photo_url"),
  photoStorageKey: text("photo_storage_key"),
  lastLoginAt: timestamptz("last_login_at"),
  ...timestamps,
});
