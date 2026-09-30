import { CustomRoleNameTaken } from "../../domain/access/accessErrors.js";
import type { CustomRoleRecord, NewCustomRole, RoleRepository } from "../ports/roleRepository.js";

/** An admin creates a role on top of a base role, granting or denying single permissions. */
export class CreateCustomRole {
  constructor(private readonly roles: RoleRepository) {}

  async execute(input: NewCustomRole): Promise<CustomRoleRecord> {
    if (await this.roles.findCustomRoleByName(input.name)) throw new CustomRoleNameTaken();
    return this.roles.createCustomRole(input);
  }
}
