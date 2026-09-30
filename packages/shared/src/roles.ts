import { z } from "zod";
import { baseRoleSchema } from "./auth.js";
import { permissionKeySchema } from "./permissions.js";

export const permissionEffectSchema = z.enum(["grant", "deny"]);

/** A custom role's explicit decision on one permission. Keys it doesn't list are inherited. */
export const permissionEntrySchema = z.object({
  key: permissionKeySchema,
  effect: permissionEffectSchema,
});

const entriesSchema = z
  .array(permissionEntrySchema)
  .refine((entries) => new Set(entries.map((entry) => entry.key)).size === entries.length, {
    message: "Each permission can only be listed once.",
  });

const roleNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a role name.")
  .max(60, "Role name is too long.");
const roleDescriptionSchema = z.string().trim().max(300, "Description is too long.").nullable();

export const createCustomRoleRequestSchema = z.object({
  name: roleNameSchema,
  baseRole: baseRoleSchema,
  description: roleDescriptionSchema,
  entries: entriesSchema,
});

/** The base role is fixed once a custom role exists; create a new role to change it. */
export const updateCustomRoleRequestSchema = createCustomRoleRequestSchema.omit({ baseRole: true });

export const customRoleSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  baseRole: baseRoleSchema,
  description: z.string().nullable(),
  userCount: z.number().int().nonnegative(),
  entries: z.array(permissionEntrySchema),
});

export const baseRoleSummarySchema = z.object({
  id: baseRoleSchema,
  name: z.string(),
  /** What the base role grants. Admin lists every permission. */
  grants: z.array(permissionKeySchema),
  userCount: z.number().int().nonnegative(),
});

export const roleListSchema = z.object({
  baseRoles: z.array(baseRoleSummarySchema),
  customRoles: z.array(customRoleSchema),
});

export const assignCustomRoleRequestSchema = z.object({
  /** null goes back to the plain base role. */
  customRoleId: z.uuid().nullable(),
});

export const roleIdParamsSchema = z.object({
  id: z.uuid("Not a valid role id."),
});

export type PermissionEffect = z.infer<typeof permissionEffectSchema>;
export type PermissionEntry = z.infer<typeof permissionEntrySchema>;
export type CreateCustomRoleRequest = z.infer<typeof createCustomRoleRequestSchema>;
export type UpdateCustomRoleRequest = z.infer<typeof updateCustomRoleRequestSchema>;
export type CustomRole = z.infer<typeof customRoleSchema>;
export type BaseRoleSummary = z.infer<typeof baseRoleSummarySchema>;
export type RoleList = z.infer<typeof roleListSchema>;
export type AssignCustomRoleRequest = z.infer<typeof assignCustomRoleRequestSchema>;
