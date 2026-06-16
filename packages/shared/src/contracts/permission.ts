import { z } from "zod";
import { PermissionCategorySchema, RoleSchema } from "./enums";
import { isoDateTime, permissionKey, uuid } from "./primitives";

/* =====================================================================
 * PERMISSIONS  (feature-level access control / UI gating)
 *
 * Effective permission for a user =
 *   user_permission_override.is_granted (if exists and not expired)
 *   ELSE role_permission.is_granted     (default for the user's role)
 *   ELSE false                          (deny by default)
 * ===================================================================== */

/* --- Permission catalog --- */
export const PermissionSchema = z.object({
  id: uuid,
  key: permissionKey,
  label: z.string(),
  description: z.string().nullable(),
  category: PermissionCategorySchema,
  isActive: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Permission = z.infer<typeof PermissionSchema>;

export const CreatePermissionInputSchema = z.object({
  key: permissionKey,
  label: z.string().min(1).max(160),
  description: z.string().max(500).optional().nullable(),
  category: PermissionCategorySchema,
  isActive: z.boolean().optional().default(true),
});
export type CreatePermissionInput = z.infer<typeof CreatePermissionInputSchema>;

export const UpdatePermissionInputSchema = z.object({
  id: uuid,
  label: z.string().min(1).max(160).optional(),
  description: z.string().max(500).nullable().optional(),
  category: PermissionCategorySchema.optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionInputSchema>;

export const ListPermissionsInputSchema = z.object({
  category: PermissionCategorySchema.optional(),
  isActive: z.boolean().optional(),
  search: z.string().max(120).optional(),
});
export type ListPermissionsInput = z.infer<typeof ListPermissionsInputSchema>;

/* --- Role defaults --- */
export const RolePermissionSchema = z.object({
  id: uuid,
  role: RoleSchema,
  permissionId: uuid,
  isGranted: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type RolePermission = z.infer<typeof RolePermissionSchema>;

export const SetRolePermissionInputSchema = z.object({
  role: RoleSchema,
  permissionId: uuid,
  isGranted: z.boolean(),
});
export type SetRolePermissionInput = z.infer<
  typeof SetRolePermissionInputSchema
>;

export const BulkSetRolePermissionsInputSchema = z.object({
  role: RoleSchema,
  permissions: z
    .array(
      z.object({
        permissionId: uuid,
        isGranted: z.boolean(),
      }),
    )
    .min(1),
});
export type BulkSetRolePermissionsInput = z.infer<
  typeof BulkSetRolePermissionsInputSchema
>;

export const ListRolePermissionsInputSchema = z.object({
  role: RoleSchema,
});
export type ListRolePermissionsInput = z.infer<
  typeof ListRolePermissionsInputSchema
>;

/* --- Per-user overrides --- */
export const UserPermissionOverrideSchema = z.object({
  id: uuid,
  userId: uuid,
  permissionId: uuid,
  isGranted: z.boolean(),
  reason: z.string().nullable(),
  grantedByUserId: uuid,
  expiresAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type UserPermissionOverride = z.infer<
  typeof UserPermissionOverrideSchema
>;

export const SetUserPermissionOverrideInputSchema = z.object({
  userId: uuid,
  permissionId: uuid,
  isGranted: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
  expiresAt: isoDateTime.optional().nullable(),
});
export type SetUserPermissionOverrideInput = z.infer<
  typeof SetUserPermissionOverrideInputSchema
>;

export const ClearUserPermissionOverrideInputSchema = z.object({
  userId: uuid,
  permissionId: uuid,
});
export type ClearUserPermissionOverrideInput = z.infer<
  typeof ClearUserPermissionOverrideInputSchema
>;

export const ListUserPermissionOverridesInputSchema = z.object({
  userId: uuid,
});
export type ListUserPermissionOverridesInput = z.infer<
  typeof ListUserPermissionOverridesInputSchema
>;

/* --- Effective permissions (what the frontend consumes after login) --- */
export const EffectivePermissionSchema = z.object({
  key: permissionKey,
  isGranted: z.boolean(),
  source: z.enum(["override", "role", "default_deny"]),
});
export type EffectivePermission = z.infer<typeof EffectivePermissionSchema>;

export const EffectivePermissionMapSchema = z.record(z.boolean());
export type EffectivePermissionMap = z.infer<
  typeof EffectivePermissionMapSchema
>;

export const GetEffectivePermissionsInputSchema = z.object({
  userId: uuid.optional(), // omit = "me"; admin can pass another userId
});
export type GetEffectivePermissionsInput = z.infer<
  typeof GetEffectivePermissionsInputSchema
>;
