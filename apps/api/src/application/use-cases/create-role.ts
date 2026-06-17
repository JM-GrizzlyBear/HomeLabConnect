import type { CreateRoleInput, PublicRole } from "@homelabconnect/shared";
import { ConflictError } from "../../domain/error";
import type { RoleRepository } from "../ports/role-repository";

export class CreateRoleUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async exec(input: CreateRoleInput): Promise<PublicRole> {
    const existing = await this.roles.findByRole(input.role);
    if (existing) throw new ConflictError("Role already exists");
    return this.roles.create(input);
  }
}
