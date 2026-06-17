import { z } from "zod";
import { RoleSchema } from "./enums";
import { isoDateTime, uuid } from "./primitives";

/* =====================================================================
 * ROLE  (lookup table)
 *
 * Each row pairs a Role enum value with a human-readable description
 * shown in admin UIs and role pickers. The 5 enum values are seeded
 * once on first run; admins edit the description but cannot change the
 * `role` value of an existing row (it's the FK target for users.role).
 * ===================================================================== */

export const PublicRoleSchema = z.object({
  id: uuid,
  role: RoleSchema,
  description: z.string(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type PublicRole = z.infer<typeof PublicRoleSchema>;

export const CreateRoleInputSchema = z.object({
  role: RoleSchema,
  description: z.string().min(1).max(500),
});
export type CreateRoleInput = z.infer<typeof CreateRoleInputSchema>;

export const UpdateRoleInputSchema = z.object({
  id: uuid,
  description: z.string().min(1).max(500),
});
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;

export const GetRoleInputSchema = z.object({ id: uuid });
export type GetRoleInput = z.infer<typeof GetRoleInputSchema>;

export const GetRoleByEnumInputSchema = z.object({ role: RoleSchema });
export type GetRoleByEnumInput = z.infer<typeof GetRoleByEnumInputSchema>;

export const ListRolesOutputSchema = z.array(PublicRoleSchema);
export type ListRolesOutput = z.infer<typeof ListRolesOutputSchema>;
