import type { PublicRole } from "@homelabconnect/shared";
import type { RoleRepository } from "../ports/role-repository";

export class ListRolesUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async exec(): Promise<PublicRole[]> {
    return this.roles.list();
  }
}
