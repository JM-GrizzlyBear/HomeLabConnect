import { CustomRoleNotFound } from "../../domain/access/accessErrors.js";
import { assertRoleUnused } from "../../domain/access/customRole.js";
import type { RoleRepository } from "../../domain/access/RoleRepository.js";

export interface DeleteCustomRoleInput {
  id: string;
}

/** Deletes a role nobody holds. */
export class DeleteCustomRole {
  constructor(private readonly roles: RoleRepository) {}

  async execute({ id }: DeleteCustomRoleInput): Promise<void> {
    const role = await this.roles.findCustomRole(id);
    if (!role) throw new CustomRoleNotFound();
    assertRoleUnused(role.userCount);
    await this.roles.deleteCustomRole(id);
  }
}
