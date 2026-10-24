import { CustomRoleNameTaken, CustomRoleNotFound } from "../../domain/access/accessErrors.js";
import type {
  CustomRoleChanges,
  CustomRoleRecord,
  RoleRepository,
} from "../../domain/access/RoleRepository.js";

export interface UpdateCustomRoleInput extends CustomRoleChanges {
  id: string;
}

/**
 * An admin renames a role or changes its entries. The base role stays fixed,
 * so users already holding the role keep a matching base role. Holders see the
 * change on their next request.
 */
export class UpdateCustomRole {
  constructor(private readonly roles: RoleRepository) {}

  async execute({ id, ...changes }: UpdateCustomRoleInput): Promise<CustomRoleRecord> {
    if (!(await this.roles.findCustomRole(id))) throw new CustomRoleNotFound();
    const sameName = await this.roles.findCustomRoleByName(changes.name);
    if (sameName && sameName.id !== id) throw new CustomRoleNameTaken();

    await this.roles.updateCustomRole(id, changes);
    const updated = await this.roles.findCustomRole(id);
    if (!updated) throw new CustomRoleNotFound();
    return updated;
  }
}
