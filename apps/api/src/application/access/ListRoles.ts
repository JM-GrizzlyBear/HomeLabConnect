import type { BaseRoleRecord, CustomRoleRecord, RoleRepository } from "../ports/roleRepository.js";

export interface RoleListOutput {
  baseRoles: BaseRoleRecord[];
  customRoles: CustomRoleRecord[];
}

/** Every base role with its grants, and every custom role with its entries. */
export class ListRoles {
  constructor(private readonly roles: RoleRepository) {}

  async execute(): Promise<RoleListOutput> {
    const [baseRoles, customRoles] = await Promise.all([
      this.roles.listBaseRoles(),
      this.roles.listCustomRoles(),
    ]);
    return { baseRoles, customRoles };
  }
}
