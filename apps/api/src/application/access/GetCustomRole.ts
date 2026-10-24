import { CustomRoleNotFound } from "../../domain/access/accessErrors.js";
import type { CustomRoleRecord, RoleRepository } from "../../domain/access/RoleRepository.js";

export interface GetCustomRoleInput {
  id: string;
}

export class GetCustomRole {
  constructor(private readonly roles: RoleRepository) {}

  async execute({ id }: GetCustomRoleInput): Promise<CustomRoleRecord> {
    const role = await this.roles.findCustomRole(id);
    if (!role) throw new CustomRoleNotFound();
    return role;
  }
}
