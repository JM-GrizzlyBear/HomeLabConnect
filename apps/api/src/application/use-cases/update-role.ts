import type { PublicRole, UpdateRoleInput } from "@homelabconnect/shared";
import { NotFoundError } from "../../domain/error";
import type { RoleRepository } from "../ports/role-repository";

export class UpdateRoleUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async exec(input: UpdateRoleInput): Promise<PublicRole> {
    const existing = await this.roles.findById(input.id);
    if (!existing) throw new NotFoundError("Role");
    return this.roles.update(input);
  }
}
